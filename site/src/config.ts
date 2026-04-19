/**
 * Central config for cross-app links out of the Vite landing page.
 *
 * `VITE_SUBMARINE_URL` is the deployed Next.js app. In local dev the Next
 * app runs on :2847; in prod it'll be behind the same domain. Override via
 * .env.local if you need something different.
 */
export const SUBMARINE_URL: string =
  (import.meta as unknown as { env: Record<string, string> }).env
    ?.VITE_SUBMARINE_URL ?? "http://localhost:2847/office";
