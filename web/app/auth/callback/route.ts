import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /auth/callback — Supabase's return landing after the Google redirect.
 *
 * Supabase appends `?code=<pkce>`; we trade that for a session (sets the
 * `sb-*` cookies via the server client) and then forward the user to
 * wherever they were headed before hailing. On failure we bounce back to
 * `/hail` with the error surfaced in the URL so the UI can show it.
 *
 * `next` is constrained to same-origin relative paths to avoid open-
 * redirect abuse via a crafted `?next=https://evil`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/hail?error=missing+code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/hail?error=${msg}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

function sanitizeNext(raw: string | null): string {
  if (!raw) return "/office";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/office";
  return raw;
}
