"use client";

import CritiquePage from "./CritiquePage";
import "./critique.css";

/**
 * Client shell for the marketing landing — imports scoped CSS once.
 * Routed at `/` from `app/page.tsx` so Dean + Tsunami stay on the same origin.
 */
export default function CritiqueLanding() {
  return <CritiquePage />;
}
