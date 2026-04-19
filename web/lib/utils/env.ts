/**
 * Guarded env access. Fails loudly if a required var is missing so we find
 * out at boot, not 90 seconds into a demo.
 */

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export function optionalEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DEMO_STUDENT_ID =
  process.env.DEMO_STUDENT_ID ?? "00000000-0000-4000-8000-000000000001"; // Maria's fixed UUID

/**
 * DEMO_DATE simulates "today" during demo recording. Lets Pacer show live
 * EA/ED deadlines even if we're recording in May. ISO format: "2025-11-15".
 * When unset, real clock is used.
 */
export function today(): Date {
  const iso = process.env.DEMO_DATE;
  return iso ? new Date(iso) : new Date();
}

/** Is the current server configured to hit real Supabase? */
export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Admin-scoped Supabase for server routes that need to bypass RLS (ingest). */
export function supabaseServiceRoleKey(): string | undefined {
  return optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function anthropicApiKey(): string {
  return requireEnv("ANTHROPIC_API_KEY");
}
