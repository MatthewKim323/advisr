"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import CritiquePage from "./CritiquePage";
import { LoadingScreen } from "./LoadingScreen";
import "./critique.css";

/**
 * Client shell for the marketing landing.
 *
 * Two concerns live here because they're both "whole landing" scope:
 *
 *   1. Loader gate. We want the dive loader to play on every HARD load
 *      (page refresh, fresh tab, direct nav) but NOT on client-side
 *      navigation back from /office. Solution: a module-level
 *      `hasBootedThisSession` flag. It lives for the life of the JS
 *      module — survives React remounts (client-side nav back to `/`)
 *      but resets on full page reload. That's exactly what we want.
 *      NOTE: we intentionally do NOT persist this in sessionStorage.
 *      Doing so silently kills the loader on refresh, which the user
 *      flagged as a bug ("when i refresh it doesnt show up"). The
 *      refresh IS meant to show the loader.
 *
 *   2. Smooth scroll. Native browser scroll + heavy page = jittery
 *      motion reads as broken. We install a Lenis scroll-smoother
 *      (same pattern iris uses) so every scroll event decays through
 *      an inertial rAF loop. This pairs with the hero parallax in
 *      `CritiquePage` — the video drifts smoothly instead of stepping.
 */

let hasBootedThisSession = false;

export default function CritiqueLanding() {
  const [hasBooted, setHasBooted] = useState(hasBootedThisSession);

  // Lenis global smooth scroll — mount once per module lifetime.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.25,
      // framer-style inertial ease — the exponential-out gives a weighted
      // settle with a crisp initial response.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      wheelMultiplier: 1.0,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  const handleComplete = () => {
    hasBootedThisSession = true;
    setHasBooted(true);
  };

  return (
    <>
      <CritiquePage />
      {!hasBooted && <LoadingScreen onComplete={handleComplete} />}
    </>
  );
}
