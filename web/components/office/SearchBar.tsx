"use client";

/**
 * F1 — "Tell me what I said" search bar.
 *
 * Debounced to 150ms. Fires:
 *   1. `commitOptimistic(query)` immediately (synchronous; cheap prefix match).
 *   2. POST /api/search after debounce; commitAuthoritative on response.
 *
 * Width clamped to 560px so the hero beat reads consistently across resolutions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useOfficeStore } from "@/lib/stores/officeStore";

const DEBOUNCE_MS = 150;

export default function SearchBar({ studentId }: { studentId: string }) {
  const [value, setValue] = useState("");
  const commitOptimistic = useOfficeStore((s) => s.commitOptimistic);
  const commitAuthoritative = useOfficeStore((s) => s.commitAuthoritative);
  const reset = useOfficeStore((s) => s.reset);
  const optimistic = useOfficeStore((s) => s.optimistic);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fire = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        reset();
        return;
      }
      commitOptimistic(q);

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const r = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, studentId }),
          signal: ctrl.signal,
        });
        if (!r.ok) return;
        const data = (await r.json()) as {
          query: string;
          hitsByScope: { student: unknown[]; world: unknown[] };
        };
        const allHits = [
          ...(data.hitsByScope.student as never[]),
          ...(data.hitsByScope.world as never[]),
        ];
        commitAuthoritative(q, allHits);
      } catch {
        // Aborted or network blip. Leave optimistic in place.
      }
    },
    [commitOptimistic, commitAuthoritative, reset, studentId],
  );

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void fire(value), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, fire]);

  return (
    <div className="pointer-events-auto mx-auto w-full" style={{ maxWidth: 560 }}>
      <label
        htmlFor="tell-me-what-i-said"
        className="sr-only"
      >
        Tell me what I said
      </label>
      <div
        className="flex items-center gap-3 rounded-sm px-3.5 py-2.5"
        style={{
          background: "rgba(10,26,38,0.82)",
          boxShadow:
            "0 0 0 1px rgba(230,165,89,0.45) inset, 0 0 18px rgba(230,165,89,0.12)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          className="pixel-text"
          style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.24em" }}
        >
          F1
        </span>
        <input
          id="tell-me-what-i-said"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="tell me what i said…"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-hud)",
            fontSize: 16,
            color: "var(--foam)",
            letterSpacing: "0.03em",
          }}
        />
        <span
          aria-hidden
          style={{
            width: 7,
            height: 16,
            background: optimistic ? "var(--brass)" : "var(--sonar)",
            boxShadow: `0 0 6px ${optimistic ? "var(--brass)" : "var(--sonar)"}`,
            animation: "cursor-blink 1s steps(2) infinite",
          }}
        />
      </div>
      <div
        className="mt-1.5 text-center"
        style={{
          fontFamily: "var(--font-hud)",
          fontSize: 11,
          color: "var(--kelp)",
          letterSpacing: "0.18em",
        }}
      >
        {optimistic ? "SEARCHING LOCAL…" : "COMMITTED"}
      </div>
    </div>
  );
}
