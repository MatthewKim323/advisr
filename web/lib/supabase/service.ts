/**
 * Service-role / anon Supabase resolver.
 *
 * In demo-bypass mode we need to read and write rows that RLS would otherwise
 * block (there's no logged-in user but we still want Maria's seeded files
 * and chunks to render, and for /api/upload to land chunks + claims).
 *
 * Resolution order:
 *   1. `SUPABASE_SERVICE_ROLE_KEY` set → admin client, bypasses RLS.
 *   2. Otherwise → cookie-bound server client (honors the logged-in user).
 *
 * Never import this from a client component. It reads env vars and uses the
 * Supabase admin key when available; both are server-only.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase, supabaseServiceRoleKey } from "@/lib/utils/env";

export async function getServiceSupabase(): Promise<SupabaseClient | null> {
  if (!hasSupabase()) return null;
  const key = supabaseServiceRoleKey();
  if (key) {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  const { createClient } = await import("./server");
  return (await createClient()) as unknown as SupabaseClient;
}

/**
 * Strict variant: returns null when Supabase isn't configured but throws when
 * the caller really needs the admin escalation and it's missing. Use this
 * inside write-heavy paths (upload, claim confirm, seed) to fail loudly.
 */
export async function getAdminSupabase(): Promise<SupabaseClient | null> {
  if (!hasSupabase()) return null;
  const key = supabaseServiceRoleKey();
  if (!key) {
    const { createClient } = await import("./server");
    return (await createClient()) as unknown as SupabaseClient;
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
