import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /auth/signout — called by the HUD's CrewBadge form via POST. Drops the
 * Supabase session cookies and surfaces the user back at /hail.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/hail`, { status: 303 });
}
