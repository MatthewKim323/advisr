/**
 * Same-origin navigation into the submarine (/office). Marketing and product
 * share one Next.js app in dev and prod — no second port.
 *
 * Optional: set NEXT_PUBLIC_NAMI_OFFICE_URL to override the href (e.g. preview URL).
 */

const DEMO_QUERY = "?demo=maria";

export function getOfficeUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_NAMI_OFFICE_URL;
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    return explicit.trim();
  }
  return `/office${DEMO_QUERY}`;
}

/** Full-page navigation — keeps middleware demo-bypass + office bootstrap consistent. */
export function diveToOffice(): void {
  if (typeof window === "undefined") return;
  window.location.href = getOfficeUrl();
}
