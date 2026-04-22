"use client";

import { useEffect, useState } from "react";
import CritiquePage from "./CritiquePage";
import { LoadingScreen } from "./LoadingScreen";
import "./critique.css";

/**
 * Client shell for the marketing landing — gates `CritiquePage` behind the
 * bathysphere dive loader.
 *
 * Re-boot strategy (the important bit):
 *   - A module-level flag, `hasBootedThisSession`, survives the React
 *     remount that fires when the user navigates `/office → /` via the
 *     SURFACE link. Without it, the loader would replay from 0% on every
 *     client-side navigation back to the landing — which felt broken.
 *   - `sessionStorage` catches the cross-tab case (hard refresh, middle-
 *     click into a new tab, etc.).
 *   - The critique page is always mounted; the loader is a `position:
 *     fixed` overlay that covers it on first boot and removes itself.
 *     This means no hydration mismatch and no flash of landing content
 *     before the loader appears.
 */

let hasBootedThisSession = false;

export default function CritiqueLanding() {
  const [hasBooted, setHasBooted] = useState(hasBootedThisSession);

  useEffect(() => {
    if (hasBootedThisSession) return;
    try {
      if (
        typeof window !== "undefined" &&
        window.sessionStorage?.getItem("nami:landing-booted") === "1"
      ) {
        hasBootedThisSession = true;
        setHasBooted(true);
      }
    } catch {
      // sessionStorage can throw in strict privacy modes — no-op.
    }
  }, []);

  const handleComplete = () => {
    hasBootedThisSession = true;
    try {
      window.sessionStorage?.setItem("nami:landing-booted", "1");
    } catch {
      // ignore
    }
    setHasBooted(true);
  };

  return (
    <>
      <CritiquePage />
      {!hasBooted && <LoadingScreen onComplete={handleComplete} />}
    </>
  );
}
