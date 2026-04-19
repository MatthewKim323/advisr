"use client";

/**
 * DeanInterjectionLayer — mounts once inside the office page.
 *
 * Listens on the server-sent events stream for `response_to_user` events
 * (emitted by F2 callback agent + any future "Dean speaks unprompted" path)
 * and surfaces them as a floating intercom bubble over the pixel deck.
 *
 * Self-expires after 10s so the message doesn't linger and fight the hero
 * close line. The user can dismiss earlier by clicking.
 */

import { useEffect } from "react";
import { useOfficeEvents } from "@/lib/events/client";
import { useOfficeStore } from "@/lib/stores/officeStore";

const INTERJECTION_TTL_MS = 10_000;

export default function DeanInterjectionLayer() {
  const interjection = useOfficeStore((s) => s.interjection);
  const pushInterjection = useOfficeStore((s) => s.pushInterjection);
  const clearInterjection = useOfficeStore((s) => s.clearInterjection);

  useOfficeEvents((evt) => {
    // Only true unprompted beats surface a bubble. Regular chat turns emit
    // `response_to_user` and belong in the chat panel, not over the canvas.
    if (evt.type === "dean_interjection") {
      pushInterjection(evt.text);
    }
  });

  useEffect(() => {
    if (!interjection) return;
    const t = window.setTimeout(clearInterjection, INTERJECTION_TTL_MS);
    return () => window.clearTimeout(t);
  }, [interjection, clearInterjection]);

  if (!interjection) return null;

  return (
    <div
      className="pointer-events-auto absolute left-1/2 z-30 w-[min(92vw,620px)] -translate-x-1/2 cursor-pointer px-4 py-3"
      style={{
        top: 68,
        background:
          "linear-gradient(180deg, rgba(7,21,33,0.96) 0%, rgba(3,14,22,0.98) 100%)",
        border: "1px solid rgba(230,165,89,0.55)",
        boxShadow:
          "inset 0 0 0 1px rgba(230,165,89,0.15), 0 0 36px rgba(230,165,89,0.22), 0 10px 40px rgba(3,18,30,0.7)",
        animation: "lamp-flicker 0.7s steps(3, end) 1",
        borderRadius: 2,
      }}
      onClick={clearInterjection}
      role="status"
      aria-live="polite"
    >
      <div
        className="pixel-text mb-1 flex items-center justify-between"
        style={{
          fontSize: 9,
          color: "var(--brass)",
          letterSpacing: "0.32em",
        }}
      >
        <span>DEAN ↯ UNPROMPTED</span>
        <span style={{ color: "var(--kelp)", letterSpacing: "0.2em" }}>
          CLICK TO DISMISS
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          lineHeight: 1.5,
          color: "var(--pearl, #e8f1ea)",
        }}
      >
        {interjection.text}
      </div>
    </div>
  );
}
