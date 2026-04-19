"use client";

/**
 * D4 — KnowledgeConstellation.
 *
 * Uses `react-force-graph-2d` to render a force-directed graph of the
 * student's entities + edges. Subscribes to officeStore — nodes tied to
 * current query hits pulse in amber.
 *
 * Dynamic import (SSR false) to keep SSR out of the canvas/WebGL path and
 * code-split the ~150–200kb bundle off the initial page load.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOfficeStore } from "@/lib/stores/officeStore";
import { useOfficeEvents } from "@/lib/events/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic<any>(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false, loading: () => <ConstellationFallback /> },
);

interface GraphNode {
  id: string;
  label: string;
  kind: string;
  sourceFileId?: string;
  active: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  predicate: string;
  weight?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

/** Ocean-palette color by node kind. Keeps visual = graph truth. */
function colorFor(n: GraphNode): string {
  if (n.active) return "rgba(230,165,89,1)"; // brass glow
  if (n.kind === "anchor") return "rgba(124,255,147,0.9)"; // sonar green
  if (n.kind.startsWith("file:")) {
    switch (n.kind.slice(5)) {
      case "essay":
        return "rgba(255,117,87,0.88)"; // coral — essays you wrote
      case "transcript":
        return "rgba(77,216,211,0.88)"; // bio — things you said
      case "financial":
        return "rgba(230,165,89,0.7)"; // brass — numbers
      case "activity":
        return "rgba(94,166,135,0.85)"; // kelp — what you do
      default:
        return "rgba(143,179,196,0.75)";
    }
  }
  return "rgba(143,179,196,0.65)";
}

export default function KnowledgeConstellation({
  studentId,
}: {
  studentId: string;
}) {
  const [data, setData] = useState<GraphData | null>(null);
  const hits = useOfficeStore((s) => s.hits);
  const pushInterjection = useOfficeStore((s) => s.pushInterjection);
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 400 });

  const onNodeClick = (n: GraphNode) => {
    if (n.kind === "file:essay" && n.sourceFileId) {
      // F2 callback — unprompted Dean beat when student opens an essay.
      // Fire-and-forget; the dean_interjection event arrives via SSE and
      // DeanInterjectionLayer surfaces it. We also do an optimistic push so
      // the bubble shows even if SSE is slow (prod: Vercel Edge caveats).
      fetch("/api/callback/essay-opened", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          essayFileId: n.sourceFileId,
          essayText: n.label,
        }),
      })
        .then((r) => r.json())
        .then((j: { fired?: boolean; message?: string }) => {
          if (j.fired && j.message) pushInterjection(j.message);
        })
        .catch(() => void 0);
    }
  };

  const refresh = useCallback(() => {
    let alive = true;
    fetch(`/api/profile/graph?studentId=${encodeURIComponent(studentId)}`)
      .then((r) => (r.ok ? r.json() : { nodes: [], links: [] }))
      .then((j: GraphData) => {
        if (alive) setData(j);
      })
      .catch(() => {
        if (alive) setData({ nodes: [], links: [] });
      });
    return () => {
      alive = false;
    };
  }, [studentId]);

  useEffect(() => refresh(), [refresh]);

  // Re-fetch whenever upload completes (DOM event from DropZone lands first;
  // the SSE event `ingestion_finished` is a fallback for cross-process writes).
  useEffect(() => {
    const onUploaded = () => refresh();
    window.addEventListener("nami:uploads-indexed", onUploaded);
    return () => window.removeEventListener("nami:uploads-indexed", onUploaded);
  }, [refresh]);

  useOfficeEvents((evt) => {
    if (
      evt.type === "ingestion_finished" ||
      evt.type === "claim_confirmed" ||
      evt.type === "claim_rejected"
    ) {
      refresh();
    }
  });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      if (!ref.current) return;
      setSize({
        w: ref.current.clientWidth,
        h: ref.current.clientHeight,
      });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const activeNodeIds = useMemo(() => {
    const s = new Set<string>();
    for (const h of hits) {
      for (const t of h.text.toLowerCase().split(/[^a-z0-9]+/)) {
        if (t.length >= 3) s.add(t);
      }
    }
    return s;
  }, [hits]);

  const decorated = useMemo<GraphData | null>(() => {
    if (!data) return null;
    return {
      links: data.links,
      nodes: data.nodes.map((n) => ({
        ...n,
        active: activeNodeIds.has(n.label.toLowerCase()),
      })),
    };
  }, [data, activeNodeIds]);

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(77,216,211,0.07) 0%, rgba(3,18,30,0) 65%)",
      }}
    >
      {decorated && decorated.nodes.length > 0 ? (
        <ForceGraph2D
          graphData={decorated}
          width={size.w}
          height={size.h}
          nodeLabel={(n: GraphNode) => `${n.label} (${n.kind})`}
          nodeColor={colorFor}
          nodeRelSize={5}
          nodeVal={(n: GraphNode) => (n.active ? 3.2 : n.kind === "anchor" ? 2.5 : 1.2)}
          linkColor={() => "rgba(77,216,211,0.22)"}
          linkWidth={(l: GraphEdge) => 0.6 + Math.min(2.4, (l.weight ?? 1) * 1.1)}
          linkDirectionalParticles={0}
          backgroundColor="rgba(0,0,0,0)"
          cooldownTicks={120}
          warmupTicks={50}
          onNodeClick={onNodeClick}
        />
      ) : decorated ? (
        <ConstellationEmpty />
      ) : (
        <ConstellationFallback />
      )}
    </div>
  );
}

function ConstellationFallback() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ color: "var(--kelp)", fontFamily: "var(--font-hud)", fontSize: 12 }}
    >
      — sounding the graph —
    </div>
  );
}

function ConstellationEmpty() {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-2 px-8 text-center"
      style={{ color: "var(--kelp)" }}
    >
      {/* Caustic drift + pinpoint starfield while the constellation is empty. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(124,255,147,0.08) 0%, rgba(3,18,30,0) 60%)," +
            "radial-gradient(ellipse at 78% 75%, rgba(230,165,89,0.07) 0%, rgba(3,18,30,0) 65%)",
          animation: "caustic-drift 14s ease-in-out infinite",
        }}
      />
      {/* 12 stars, pseudo-random positions. Each twinkles on its own offset. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {[
          [14, 22],
          [62, 18],
          [38, 44],
          [82, 32],
          [24, 60],
          [70, 56],
          [48, 70],
          [12, 78],
          [90, 68],
          [55, 12],
          [32, 88],
          [75, 84],
        ].map(([x, y], i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 2,
              height: 2,
              background: i % 3 === 0 ? "var(--brass, #e6a559)" : "var(--pearl, #f1e4c5)",
              boxShadow: `0 0 4px ${
                i % 3 === 0 ? "rgba(230,165,89,0.6)" : "rgba(241,228,197,0.6)"
              }`,
              opacity: 0.45,
              animation: `bubble-pip 2.${i}s steps(2) infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="pixel-text relative"
        style={{
          fontSize: 9,
          color: "var(--brass)",
          letterSpacing: "0.32em",
          textShadow: "0 0 12px rgba(230,165,89,0.35)",
        }}
      >
        CONSTELLATION · DARK
      </div>
      <div
        className="relative"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--foam-dim, #8fb3c4)",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        No files yet. Drop a transcript, an essay, an activities list — the
        Archivist will chart the first stars.
      </div>
      <div
        className="pixel-text relative mt-3"
        style={{
          fontSize: 8,
          color: "var(--kelp, #5ea687)",
          letterSpacing: "0.28em",
          opacity: 0.7,
        }}
      >
        DRAG FILES ANYWHERE · CHUTE OPEN
      </div>
    </div>
  );
}
