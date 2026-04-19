import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser (Client Components).
 *
 * Reads the public anon key — safe to ship to the client. Used by the
 * `/hail` HailButton to kick off the OAuth redirect.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
