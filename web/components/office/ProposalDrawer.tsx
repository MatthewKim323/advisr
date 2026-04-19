"use client";

/**
 * ProposalDrawer — slide-in right panel that surfaces freshly-proposed
 * claims for one-tap confirm/reject.
 *
 * Behavior:
 *   - Closed by default; slides open when `claim_proposed` fires OR the
 *     intercom toggle is clicked.
 *   - On open (or claim event) re-fetches `/api/proposals?status=pending`.
 *   - Confirm/reject optimistically hide the row, then PATCH. On failure
 *     we reveal the row again + surface a small error chip.
 *
 * Surface fits into the /office layer stack (z:30). The `DeanInterjectionLayer`
 * stays on z:40 so interjection bubbles still pop over the drawer if they
 * collide.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOfficeEvents } from "@/lib/events/client";
import type { ProposalRow } from "@/app/api/proposals/route";

type RowState = "idle" | "confirming" | "rejecting" | "hidden" | "error";

interface DrawerState {
  open: boolean;
  loading: boolean;
  rows: ProposalRow[];
  localState: Record<string, { state: RowState; error?: string }>;
}

const INITIAL: DrawerState = {
  open: false,
  loading: false,
  rows: [],
  localState: {},
};

export default function ProposalDrawer({ studentId }: { studentId: string }) {
  const [state, setState] = useState<DrawerState>(INITIAL);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const r = await fetch(
        `/api/proposals?studentId=${encodeURIComponent(studentId)}&status=pending&limit=40`,
        { cache: "no-store" },
      );
      if (!r.ok) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const j = (await r.json()) as { proposals?: ProposalRow[] };
      setState((s) => ({
        ...s,
        loading: false,
        rows: j.proposals ?? [],
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [studentId]);

  /* Event: claim_proposed → auto-open + reload. claim_confirmed /
     claim_rejected also refresh so multi-device / cross-tab stays consistent. */
  useOfficeEvents((evt) => {
    if (evt.type === "claim_proposed") {
      setState((s) => ({ ...s, open: true }));
      void load();
    } else if (
      evt.type === "claim_confirmed" ||
      evt.type === "claim_rejected"
    ) {
      void load();
    } else if (evt.type === "ingestion_finished") {
      void load();
    }
  });

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(
    () =>
      state.rows.filter(
        (r) =>
          (state.localState[r.id]?.state ?? "idle") !== "hidden" &&
          r.status === "pending",
      ).length,
    [state.rows, state.localState],
  );

  const act = useCallback(
    async (id: string, action: "confirm" | "reject") => {
      setState((s) => ({
        ...s,
        localState: {
          ...s.localState,
          [id]: { state: action === "confirm" ? "confirming" : "rejecting" },
        },
      }));
      try {
        const r = await fetch(`/api/proposals/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, studentId }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `HTTP ${r.status}`);
        }
        setState((s) => ({
          ...s,
          localState: { ...s.localState, [id]: { state: "hidden" } },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState((s) => ({
          ...s,
          localState: {
            ...s.localState,
            [id]: { state: "error", error: message },
          },
        }));
      }
    },
    [studentId],
  );

  return (
    <>
      {/* Floating handle / toggle — brass-rimmed intercom toggle pinned right.
          Shows a pip with pending count when claims are queued. */}
      <button
        type="button"
        onClick={() => setState((s) => ({ ...s, open: !s.open }))}
        className="pointer-events-auto absolute right-5 bottom-5 z-30 flex items-center gap-2 px-3 py-2 pixel-text transition-transform"
        style={{
          fontSize: 10,
          letterSpacing: "0.24em",
          color: "var(--abyss-deep)",
          background: state.open
            ? "linear-gradient(180deg,#9c6f3b 0%,#5e4325 100%)"
            : "linear-gradient(180deg,#e6a559 0%,#9c6f3b 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(10,26,38,1), 0 8px 22px rgba(230,165,89,0.3)",
        }}
        aria-expanded={state.open}
        aria-label="Toggle proposal drawer"
      >
        <span>{state.open ? "CLOSE MANIFEST" : "OPEN MANIFEST"}</span>
        {pendingCount > 0 && (
          <span
            className="pixel-text inline-flex items-center justify-center"
            style={{
              fontSize: 9,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              color: "var(--abyss-deep)",
              background: "var(--coral, #ff7557)",
              letterSpacing: "0.1em",
              boxShadow: "inset 0 0 0 1px rgba(10,26,38,1)",
            }}
            aria-label={`${pendingCount} pending claims`}
          >
            {pendingCount}
          </span>
        )}
      </button>

      <aside
        role="region"
        aria-label="Proposal drawer"
        className="absolute top-0 z-30 flex flex-col"
        style={{
          right: 0,
          width: 380,
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(20,42,61,0.96) 0%, rgba(10,26,38,0.98) 100%)",
          boxShadow:
            "inset 1px 0 0 rgba(230,165,89,0.35), -14px 0 36px rgba(0,0,0,0.55)",
          transform: state.open ? "translateX(0%)" : "translateX(102%)",
          transition: "transform 320ms cubic-bezier(0.22, 0.9, 0.3, 1)",
          pointerEvents: state.open ? "auto" : "none",
        }}
      >
        <header
          className="flex items-baseline justify-between px-4 py-3"
          style={{
            background:
              "linear-gradient(90deg, rgba(230,165,89,0.2) 0%, rgba(230,165,89,0.04) 100%)",
            boxShadow: "inset 0 -1px 0 rgba(230,165,89,0.35)",
          }}
        >
          <h2
            className="pixel-text"
            style={{
              fontSize: 12,
              color: "var(--pearl, #f1e4c5)",
              letterSpacing: "0.24em",
            }}
          >
            CLAIMS MANIFEST · PENDING
          </h2>
          <span
            className="pixel-text"
            style={{
              fontSize: 8,
              color: "var(--brass-dim, #9c6f3b)",
              letterSpacing: "0.28em",
            }}
          >
            ARCHIVIST /v1/claims
          </span>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {state.loading && state.rows.length === 0 && (
            <EmptyNote
              title="SCANNING…"
              detail="Pulling the latest proposals off the manifest."
              tone="kelp"
            />
          )}
          {!state.loading && state.rows.length === 0 && (
            <EmptyNote
              title="NOTHING PENDING"
              detail="Drop new files on the deck to populate the archivist's queue. Every uploaded chunk can seed a claim."
              tone="kelp"
            />
          )}
          <ul className="flex flex-col gap-2">
            {state.rows.map((p) => {
              const ls = state.localState[p.id]?.state ?? "idle";
              if (ls === "hidden") return null;
              return (
                <ProposalCard
                  key={p.id}
                  row={p}
                  state={ls}
                  error={state.localState[p.id]?.error}
                  onConfirm={() => act(p.id, "confirm")}
                  onReject={() => act(p.id, "reject")}
                />
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}

function ProposalCard({
  row,
  state,
  error,
  onConfirm,
  onReject,
}: {
  row: ProposalRow;
  state: RowState;
  error?: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const pct = Math.max(4, Math.min(100, Math.round(row.confidence * 100)));
  const busy = state === "confirming" || state === "rejecting";
  const predicateLabel = prettyPredicate(row.predicate);
  const objectLabel = prettyObject(row.object);
  return (
    <li
      className="rounded-sm px-3 py-2.5"
      style={{
        background: "rgba(10,26,38,0.7)",
        boxShadow: "inset 0 0 0 1px rgba(77,216,211,0.16)",
        animation:
          state === "idle" ? "drawer-row-in 260ms ease-out both" : undefined,
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="pixel-text"
          style={{
            fontSize: 9,
            color: sensitivityColor(row.sensitivity),
            letterSpacing: "0.22em",
            padding: "2px 5px",
            boxShadow: `inset 0 0 0 1px ${sensitivityColor(row.sensitivity)}`,
          }}
        >
          {row.sensitivity.toUpperCase()}
        </span>
        <span
          className="pixel-text truncate"
          style={{
            fontSize: 10,
            color: "var(--brass, #e6a559)",
            letterSpacing: "0.2em",
          }}
          title={row.predicate}
        >
          {predicateLabel}
        </span>
        <div
          className="flex-1"
          style={{
            height: 2,
            background: "rgba(77,216,211,0.1)",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, rgba(77,216,211,0.5) 0%, var(--bio, #4dd8d3) 100%)",
            }}
          />
        </div>
        <span
          className="hud-text tabular-nums"
          style={{
            fontSize: 11,
            color: "var(--kelp, #5ea687)",
            letterSpacing: "0.04em",
          }}
        >
          {pct}%
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "var(--pearl, #f1e4c5)",
          lineHeight: 1.45,
          marginBottom: 6,
        }}
      >
        {objectLabel}
      </p>

      {row.evidenceText && (
        <p
          className="mb-2"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--foam-dim, #8fb3c4)",
            lineHeight: 1.45,
            borderLeft: "2px solid rgba(230,165,89,0.35)",
            paddingLeft: 8,
          }}
        >
          “{row.evidenceText}”
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className="hud-text truncate"
          style={{
            fontSize: 11,
            color: "var(--brass-dim, #9c6f3b)",
            letterSpacing: "0.1em",
          }}
          title={row.sourceFilename ?? undefined}
        >
          {row.sourceFilename
            ? `↳ ${row.sourceFilename}`
            : `↳ ${row.extractedBy}`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="pixel-text px-2 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--coral, #ff7557)",
              boxShadow: "inset 0 0 0 1px rgba(255,117,87,0.45)",
            }}
          >
            {state === "rejecting" ? "…" : "JETTISON"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="pixel-text px-2 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--abyss-deep)",
              background:
                "linear-gradient(180deg,#7cff93 0%,#4dd8d3 100%)",
              boxShadow: "inset 0 0 0 1px rgba(10,26,38,1)",
            }}
          >
            {state === "confirming" ? "…" : "SEAL"}
          </button>
        </div>
      </div>
      {error && (
        <p
          className="hud-text mt-2"
          style={{
            fontSize: 11,
            color: "var(--coral, #ff7557)",
            letterSpacing: "0.08em",
          }}
        >
          ! {error}
        </p>
      )}
    </li>
  );
}

function prettyPredicate(p: string): string {
  // `student.has_gpa` → "HAS GPA", `student.activity.role` → "ACTIVITY ROLE"
  return p
    .replace(/^student\./i, "")
    .replace(/[_.]/g, " ")
    .toUpperCase();
}

function prettyObject(o: unknown): string {
  if (o == null) return "—";
  if (typeof o === "string") return o;
  if (typeof o === "number") return String(o);
  if (typeof o === "boolean") return o ? "yes" : "no";
  try {
    return JSON.stringify(o);
  } catch {
    return String(o);
  }
}

function sensitivityColor(s: "low" | "medium" | "high"): string {
  if (s === "high") return "var(--coral, #ff7557)";
  if (s === "medium") return "var(--brass, #e6a559)";
  return "var(--sonar, #7cff93)";
}

function EmptyNote({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "kelp" | "coral";
}) {
  const color = tone === "coral" ? "var(--coral)" : "var(--kelp, #5ea687)";
  return (
    <div
      className="px-4 py-6"
      style={{
        boxShadow: `inset 0 0 0 1px ${
          tone === "coral"
            ? "rgba(255,117,87,0.25)"
            : "rgba(94,166,135,0.22)"
        }`,
        borderRadius: 2,
        background:
          "repeating-linear-gradient(45deg, rgba(3,18,30,0.3) 0 8px, rgba(10,26,38,0.3) 8px 16px)",
      }}
    >
      <p
        className="pixel-text mb-2"
        style={{ fontSize: 11, color, letterSpacing: "0.24em" }}
      >
        ◇ {title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--pearl, #f1e4c5)",
          lineHeight: 1.55,
        }}
      >
        {detail}
      </p>
    </div>
  );
}
