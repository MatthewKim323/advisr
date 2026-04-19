/**
 * Cross-app navigation helper.
 *
 * The landing marketing site (this Vite app, port 3000) and the Nami
 * "submarine" product (the Next.js `web/` app, port 2847) are deployed as
 * two distinct origins in dev and may be merged or kept separate in prod.
 *
 * `OFFICE_URL` resolves to the entrypoint of the submarine — the tsunami of
 * seven agents at /office — via a small precedence chain:
 *
 *   1. `VITE_NAMI_OFFICE_URL`          — explicit override (prod / preview).
 *   2. `http://localhost:2847/office?demo=maria`
 *      when the current host is `localhost`/`127.0.0.1` (dev convenience).
 *   3. `/office?demo=maria`            — same-origin fallback (assumes
 *      Vercel/host-level rewrites bridge the two Vercel projects, or they
 *      share one origin under a reverse proxy).
 *
 * The `?demo=maria` query keeps the demo-bypass middleware in `web/` happy,
 * so clicks from the landing page land inside the already-seeded bathysphere
 * without an auth round-trip — which is exactly what we want for every
 * visitor hitting the marketing site.
 */

const DEMO_QUERY = "?demo=maria";

function computeOfficeUrl(): string {
  const explicit = import.meta.env.VITE_NAMI_OFFICE_URL as string | undefined;
  if (explicit && explicit.trim().length > 0) return explicit;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `http://localhost:2847/office${DEMO_QUERY}`;
    }
  }

  return `/office${DEMO_QUERY}`;
}

export const OFFICE_URL: string = computeOfficeUrl();

/**
 * Navigate the current tab to the submarine. Full-page load (not a SPA push)
 * because the office lives in a different Next app and we want its bootstrap
 * animations + SSR auth check to run clean.
 */
export function diveToOffice(): void {
  if (typeof window === "undefined") return;
  window.location.href = OFFICE_URL;
}
