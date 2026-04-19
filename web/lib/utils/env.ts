/**
 * Guarded env access. Fails loudly if a required var is missing so we find
 * out at boot, not 90 seconds into a demo.
 */

export function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DEMO_STUDENT_ID = process.env.DEMO_STUDENT_ID ?? "maria";

/**
 * DEMO_DATE simulates "today" during demo recording. Lets Pacer show live
 * EA/ED deadlines even if we're recording in May. ISO format: "2025-11-15".
 * When unset, real clock is used.
 */
export function today(): Date {
  const iso = process.env.DEMO_DATE;
  return iso ? new Date(iso) : new Date();
}
