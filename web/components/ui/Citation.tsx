"use client";

/**
 * Citation — clickable chunk reference.
 *
 * Wherever Dean quotes the student's own data, we wrap the quote in <Citation
 * chunkId="…">. On click, the source drawer opens and highlights the chunk.
 *
 * Minimal dependency; all state lives in the store. The drawer component
 * listens to `useOfficeStore.selectedChunkId`.
 */

import { useState } from "react";

interface Props {
  chunkId: string;
  sourceFilename?: string;
  offsetStart?: number;
  offsetEnd?: number;
  children: React.ReactNode;
}

export default function Citation({
  chunkId,
  sourceFilename,
  offsetStart,
  offsetEnd,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex cursor-help items-baseline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(true)}
      data-chunk-id={chunkId}
      style={{
        textDecoration: "underline",
        textDecorationColor: "rgba(230,165,89,0.55)",
        textDecorationStyle: "dotted",
        textUnderlineOffset: "3px",
      }}
    >
      {children}
      <sup
        className="pixel-text ml-0.5"
        style={{
          fontSize: 8,
          color: "var(--brass)",
          letterSpacing: "0.14em",
        }}
      >
        RCT
      </sup>
      {open && (
        <span
          className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-sm px-2.5 py-1.5"
          style={{
            background: "rgba(5,14,22,0.95)",
            border: "1px solid rgba(230,165,89,0.4)",
            fontFamily: "var(--font-hud)",
            fontSize: 11,
            color: "var(--foam)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ color: "var(--brass)" }}>
            {sourceFilename ?? "source chunk"}
          </div>
          <div style={{ color: "var(--kelp)" }}>
            {offsetStart !== undefined && offsetEnd !== undefined
              ? `bytes ${offsetStart}–${offsetEnd}`
              : `chunk ${chunkId.slice(0, 8)}…`}
          </div>
        </span>
      )}
    </span>
  );
}
