"use client";

/**
 * LocalIndexBootstrap — fetches all of the student's chunks once on mount
 * and seeds the office store's prefix map. After that, every keystroke in
 * the sonar bar can resolve optimistically against the cache before the
 * `/api/search` response lands.
 *
 * Re-fetches whenever `ingestion_finished` fires so fresh uploads are
 * searchable without a page reload.
 *
 * Renders nothing; pure side-effect component.
 */

import { useCallback, useEffect, useRef } from "react";
import { useOfficeStore } from "@/lib/stores/officeStore";
import { useOfficeEvents } from "@/lib/events/client";
import type { SourceKind } from "@/lib/events/types";

interface ChunkRow {
  chunkId: string;
  sourceFileId: string;
  sourceKind: SourceKind;
  text: string;
  offsetStart?: number;
  offsetEnd?: number;
}

export default function LocalIndexBootstrap({
  studentId,
}: {
  studentId: string;
}) {
  const seed = useOfficeStore((s) => s.seedLocalIndex);
  const inflight = useRef(false);

  const load = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const r = await fetch(
        `/api/chunks?studentId=${encodeURIComponent(studentId)}&limit=2000`,
        { cache: "no-store" },
      );
      if (!r.ok) return;
      const j = (await r.json()) as { chunks?: ChunkRow[] };
      const hits = (j.chunks ?? []).map((c) => ({
        chunkId: c.chunkId,
        sourceFileId: c.sourceFileId,
        scope: "student" as const,
        sourceKind: c.sourceKind,
        text: c.text,
        score: 0.25, // a placeholder; real score comes from the server echo
        offsetStart: c.offsetStart,
        offsetEnd: c.offsetEnd,
      }));
      seed(hits);
    } catch {
      // swallow — optimistic path degrades gracefully to server-only search
    } finally {
      inflight.current = false;
    }
  }, [studentId, seed]);

  useEffect(() => {
    void load();
  }, [load]);

  useOfficeEvents((evt) => {
    if (evt.type === "ingestion_finished") void load();
  });

  return null;
}
