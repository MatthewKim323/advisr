"use client";

/**
 * ChatPanel — the comms console.
 *
 * Wires `useChat` from `@ai-sdk/react` to `/api/chat`. Dean is on the other
 * side of that endpoint, streaming Claude responses and calling specialist
 * tools as needed. Each tool call shows up as its own "DELEGATION" row
 * inline with the conversation — that's the whole demo visual.
 *
 * Visual grammar:
 *   SYS lines    (dim kelp green)  — ambient log primers
 *   DEAN lines   (foam on dark)    — streaming assistant replies
 *   YOU lines    (foam / sonar)    — student input echoed back
 *   DELEGATE rows (brass framed)   — tool-* parts, with state pills
 *
 * Styling stays bathysphere-themed throughout; see globals.css for the
 * Bathysphere-7 palette.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { SPECIALISTS } from "@agents/specialists";
import { renderCited } from "@/lib/chat/render-citations";

/** Specialist IDs Dean can delegate to. Keep in sync with buildDeanTools() in
 *  lib/agents/tools.ts — tool part types will be `tool-<id>` for each. */
const DELEGATE_IDS = ["archivist", "match-maker", "bursar", "scout", "draft", "pacer"] as const;
type DelegateId = typeof DELEGATE_IDS[number];
const DELEGATE_SET = new Set<string>(DELEGATE_IDS);

/** DefaultChatTransport puts the raw response body in Error.message — often JSON. */
function formatChatTransportError(message: string): string {
  const trimmed = message.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { error?: unknown };
      if (typeof parsed.error === "string" && parsed.error.length > 0) {
        return parsed.error;
      }
    } catch {
      /* fall through */
    }
  }
  return message;
}

/** Is a message part one of our specialist tool invocations? */
function isSpecialistToolPart(
  part: UIMessage["parts"][number],
): part is UIMessage["parts"][number] & { type: `tool-${string}`; state: string; input?: unknown; output?: unknown; errorText?: string; toolCallId: string } {
  if (!part.type.startsWith("tool-")) return false;
  const name = part.type.slice("tool-".length);
  return DELEGATE_SET.has(name);
}

export default function ChatPanel() {
  // A single DefaultChatTransport keeps all the SSE plumbing behind one
  // import. If we later want custom headers (auth) or a different endpoint
  // for a different agent, this is the knob.
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const chat = useChat({ transport });
  const [input, setInput] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Autoscroll on every new part. Easier than computing deltas.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.status]);

  const busy = chat.status === "submitted" || chat.status === "streaming";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    chat.sendMessage({ text });
    setInput("");
  };

  return (
    <aside
      className="relative flex h-full min-h-0 flex-col border-l"
      style={{
        borderColor: "rgba(77,216,211,0.15)",
        background:
          "linear-gradient(180deg, rgba(10,26,38,0.95) 0%, rgba(3,18,30,0.98) 100%)",
      }}
    >
      <ConsoleHeader status={chat.status} />

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        <SystemPreamble hasConversation={chat.messages.length > 0} />

        {chat.messages.length === 0 && <DeanHail />}

        {chat.messages.map((m) => (
          <MessageBlock key={m.id} message={m} />
        ))}

        {chat.status === "submitted" && <ThinkingIndicator />}

        {chat.error && (
          <div
            className="hud-text mt-3"
            style={{ color: "var(--coral)", fontSize: 14, letterSpacing: "0.04em" }}
          >
            — comms error · {formatChatTransportError(chat.error.message)}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        ref={formRef}
        className="border-t px-5 py-4"
        style={{ borderColor: "rgba(77,216,211,0.12)" }}
        onSubmit={onSubmit}
      >
        <div
          className="flex items-center gap-2 rounded-sm px-3 py-2"
          style={{
            background: "rgba(3,18,30,0.9)",
            boxShadow:
              "0 0 0 1px rgba(77,216,211,0.25) inset, 0 0 12px rgba(77,216,211,0.08)",
          }}
        >
          <span className="hud-text" style={{ color: "var(--brass)", fontSize: 16 }}>
            YOU &gt;
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={busy ? "dean is on the line…" : "hail dean…"}
            disabled={busy}
            className="flex-1 bg-transparent outline-none disabled:opacity-60"
            style={{
              fontFamily: "var(--font-hud)",
              fontSize: 18,
              color: "var(--foam)",
              letterSpacing: "0.04em",
            }}
            autoFocus
          />
          <span
            aria-hidden
            style={{
              width: 8,
              height: 18,
              background: busy ? "var(--brass)" : "var(--sonar)",
              boxShadow: `0 0 6px ${busy ? "var(--brass)" : "var(--sonar)"}`,
              animation: "cursor-blink 1s steps(2) infinite",
            }}
          />
        </div>
        <div
          className="hud-text mt-2 flex items-center justify-between"
          style={{ fontSize: 13, color: "var(--kelp)", letterSpacing: "0.18em" }}
        >
          <span>{busy ? "CHANNEL BUSY" : "ENTER · TRANSMIT"}</span>
          <span>BATHYSPHERE-7 · COMPARTMENT 01</span>
        </div>
      </form>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────────

function ConsoleHeader({ status }: { status: ReturnType<typeof useChat>["status"] }) {
  const { label, color } =
    status === "streaming"
      ? { label: "STREAMING", color: "var(--brass)" }
      : status === "submitted"
        ? { label: "ROUTING…", color: "var(--brass)" }
        : status === "error"
          ? { label: "ERROR", color: "var(--coral)" }
          : { label: "LINE OPEN", color: "var(--kelp)" };

  return (
    <div
      className="flex items-baseline justify-between border-b px-5 py-4"
      style={{ borderColor: "rgba(77,216,211,0.12)" }}
    >
      <div>
        <div
          className="pixel-text"
          style={{ fontSize: 10, color: "var(--brass)", letterSpacing: "0.22em" }}
        >
          COMMS — STATION 01
        </div>
        <div
          className="hud-text mt-1"
          style={{ fontSize: 20, color: "var(--sonar)", letterSpacing: "0.1em" }}
        >
          DEAN &gt; INTERCOM
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span
          className="inline-block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: "lamp-flicker 2.5s infinite",
          }}
        />
        <span
          className="hud-text"
          style={{ fontSize: 13, color, letterSpacing: "0.14em" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Message rendering
// ──────────────────────────────────────────────────────────────────────

function MessageBlock({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    return <UserLine text={text} />;
  }

  // Harvest chunk metadata from any prior `archivist` tool outputs so the
  // Citation hovers can show the source filename, not just `chunk abc1…`.
  const chunkMeta = collectArchivistMeta(message);

  // Assistant — interleave text + tool parts in the order they arrived.
  return (
    <div className="mb-5">
      <div
        className="pixel-text mb-1"
        style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.18em" }}
      >
        DEAN ↯
      </div>
      <div className="flex flex-col gap-2">
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p
                key={`t-${i}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "var(--foam)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderCited(part.text, { meta: chunkMeta })}
              </p>
            );
          }

          if (isSpecialistToolPart(part)) {
            const name = part.type.slice("tool-".length) as DelegateId;
            return <DelegationRow key={part.toolCallId} name={name} part={part} />;
          }

          if (part.type === "reasoning") {
            // Future: fold out reasoning if Claude ever returns it.
            return null;
          }

          return null;
        })}
      </div>
    </div>
  );
}

/**
 * Walk a message's parts; if we find an Archivist tool call with output that
 * includes `studentHits[]`, return a chunkId → {sourceFilename, offsets}
 * map so the Citation component can render a rich hover tooltip.
 *
 * Tolerant of shape changes — if the shape doesn't match, returns an empty
 * map and the citations fall back to "chunk abc1…" preview.
 */
function collectArchivistMeta(
  message: UIMessage,
): Record<string, { sourceFilename?: string; offsetStart?: number; offsetEnd?: number }> {
  const meta: Record<
    string,
    { sourceFilename?: string; offsetStart?: number; offsetEnd?: number }
  > = {};

  for (const part of message.parts) {
    if (!isArchivistToolPart(part)) continue;
    const out = (part as { output?: unknown }).output;
    if (!out || typeof out !== "object") continue;
    const hits = (out as { studentHits?: unknown }).studentHits;
    if (!Array.isArray(hits)) continue;
    for (const h of hits) {
      if (!h || typeof h !== "object") continue;
      const id = (h as { chunkId?: unknown }).chunkId;
      if (typeof id !== "string" || id.length === 0) continue;
      meta[id] = {
        sourceFilename:
          typeof (h as { sourceFilename?: unknown }).sourceFilename ===
          "string"
            ? ((h as { sourceFilename: string }).sourceFilename)
            : undefined,
        offsetStart:
          typeof (h as { offsetStart?: unknown }).offsetStart === "number"
            ? ((h as { offsetStart: number }).offsetStart)
            : undefined,
        offsetEnd:
          typeof (h as { offsetEnd?: unknown }).offsetEnd === "number"
            ? ((h as { offsetEnd: number }).offsetEnd)
            : undefined,
      };
    }
  }
  return meta;
}

function isArchivistToolPart(part: unknown): boolean {
  if (!part || typeof part !== "object") return false;
  const t = (part as { type?: unknown }).type;
  return typeof t === "string" && t === "tool-archivist";
}

function UserLine({ text }: { text: string }) {
  return (
    <div className="mb-5">
      <div
        className="pixel-text mb-1"
        style={{ fontSize: 9, color: "var(--sonar)", letterSpacing: "0.18em" }}
      >
        YOU ↯
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 15,
          lineHeight: 1.5,
          color: "var(--foam)",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Delegation row — the marquee visual
// ──────────────────────────────────────────────────────────────────────

interface DelegationRowProps {
  name: DelegateId;
  part: {
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}

function DelegationRow({ name, part }: DelegationRowProps) {
  const spec = SPECIALISTS[name];
  const { statePill, statePillColor, working } = statusFor(part.state);

  const inputQuery = summarizeInput(name, part.input);
  const outputSummary =
    part.state === "output-available" ? summarizeOutput(name, part.output) : null;
  const errorText =
    part.state === "output-error" ? part.errorText ?? "tool error" : null;

  return (
    <div
      className="relative rounded-sm px-3 py-2.5"
      style={{
        background: "rgba(10,26,38,0.65)",
        boxShadow: working
          ? "inset 0 0 0 1px rgba(230,165,89,0.55), 0 0 22px rgba(230,165,89,0.15)"
          : "inset 0 0 0 1px rgba(230,165,89,0.28)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className="pixel-text"
            style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.22em" }}
          >
            DEAN → {spec.label.toUpperCase()}
          </span>
          {spec.mode === "placeholder" && (
            <span
              className="pixel-text"
              style={{ fontSize: 8, color: "var(--kelp)", letterSpacing: "0.2em" }}
            >
              · PLACEHOLDER
            </span>
          )}
          {spec.mode === "library" && (
            <span
              className="pixel-text"
              style={{ fontSize: 8, color: "var(--kelp)", letterSpacing: "0.2em" }}
            >
              · LIBRARY
            </span>
          )}
        </div>
        <span
          className="pixel-text px-1.5 py-0.5"
          style={{
            fontSize: 8,
            letterSpacing: "0.22em",
            color: "var(--abyss-deep)",
            background: statePillColor,
          }}
        >
          {statePill}
        </span>
      </div>

      <div
        className="hud-text mt-1.5"
        style={{ fontSize: 14, color: "var(--foam)", letterSpacing: "0.03em" }}
      >
        {spec.tagline}
      </div>

      {inputQuery && (
        <div
          className="mt-1.5"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--kelp)",
          }}
        >
          <span style={{ color: "var(--brass)" }}>→ </span>
          <span style={{ color: "var(--foam-dim, #8fb3c4)" }}>{inputQuery}</span>
        </div>
      )}

      {outputSummary && (
        <div
          className="mt-1.5"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            lineHeight: 1.45,
            color: "var(--foam)",
          }}
        >
          {outputSummary}
        </div>
      )}

      {errorText && (
        <div
          className="mt-1.5"
          style={{
            fontFamily: "var(--font-hud)",
            fontSize: 13,
            color: "var(--coral)",
          }}
        >
          ! {errorText}
        </div>
      )}
    </div>
  );
}

function statusFor(state: string) {
  switch (state) {
    case "input-streaming":
      return { statePill: "DIALING", statePillColor: "var(--brass)", working: true };
    case "input-available":
      return { statePill: "WORKING", statePillColor: "var(--brass)", working: true };
    case "output-available":
      return { statePill: "RETURNED", statePillColor: "var(--kelp)", working: false };
    case "output-error":
      return { statePill: "LOST COMMS", statePillColor: "var(--coral)", working: false };
    default:
      return { statePill: state.toUpperCase(), statePillColor: "var(--brass)", working: false };
  }
}

function summarizeInput(name: DelegateId, input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const i = input as Record<string, unknown>;

  // Bursar: { schools: string[], question, perSchoolK }
  if (name === "bursar" && Array.isArray(i.schools)) {
    const schools = (i.schools as string[]).slice(0, 5).join(" · ");
    const q = (i.question as string) ?? "";
    return q ? `[${schools}] ${q}` : schools;
  }

  // Pacer: { graduationYear, schools, limit }
  if (name === "pacer" && typeof i.graduationYear === "number") {
    const schools = Array.isArray(i.schools) && (i.schools as string[]).length
      ? ` · ${(i.schools as string[]).slice(0, 4).join(", ")}`
      : " · all curated schools";
    return `class of ${i.graduationYear}${schools}`;
  }

  // Draft: { essayText, pass, schoolContext }
  if (name === "draft" && typeof i.essayText === "string") {
    const pass = typeof i.pass === "number" ? i.pass : 1;
    const ctx = typeof i.schoolContext === "string" ? ` · ${i.schoolContext}` : "";
    return `pass ${pass} · ${(i.essayText as string).length} chars${ctx}`;
  }

  // Library-backed (Archivist/Match-Maker/Scout): { query, topK }
  // Placeholder:                                  { request }
  const q = (i.query as string) ?? (i.request as string) ?? null;
  if (!q) return null;
  return q.length > 180 ? q.slice(0, 180) + "…" : q;
}

/** Shape returned by library-backed specialists (Archivist / Match-Maker /
 *  Scout). Match the `slim` shape in lib/agents/tools.ts. */
type LibraryHit = {
  source?: string;
  url?: string | null;
  text?: string;
  score?: number;
  title?: string | null;
};

function summarizeOutput(name: DelegateId, output: unknown): React.ReactNode {
  if (!output || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;

  // Error shape (come first so we don't try to render other fields on errors)
  if (o.ok === false && typeof o.error === "string") {
    return (
      <span style={{ color: "var(--coral)" }}>
        ! {o.error}
        {typeof o.note === "string" && (
          <span style={{ color: "var(--kelp)" }}> · {o.note as string}</span>
        )}
      </span>
    );
  }

  // Pacer: { ok, today, phase, tasks: PacerTask[], schoolsRecognized, schoolsUnknown }
  if (name === "pacer" && Array.isArray(o.tasks)) {
    const tasks = o.tasks as Array<{
      id: string;
      title: string;
      daysUntil: number;
      urgency: "critical" | "soon" | "upcoming";
      schoolLabel: string | null;
      round: string | null;
    }>;
    const phase = typeof o.phase === "string" ? (o.phase as string) : "";
    const unknown = Array.isArray(o.schoolsUnknown)
      ? (o.schoolsUnknown as string[])
      : [];
    return (
      <div className="flex flex-col gap-1.5">
        <div style={{ color: "var(--kelp)" }}>
          — {phase.toLowerCase().replace("_", " ")} · {tasks.length} task
          {tasks.length === 1 ? "" : "s"}
          {unknown.length > 0 && ` · no data for ${unknown.join(", ")}`}
        </div>
        {tasks.slice(0, 5).map((t) => {
          const color =
            t.urgency === "critical"
              ? "var(--coral)"
              : t.urgency === "soon"
                ? "var(--brass)"
                : "var(--kelp)";
          const days =
            t.daysUntil < 0
              ? `${Math.abs(t.daysUntil)}d past`
              : t.daysUntil === 0
                ? "TODAY"
                : `${t.daysUntil}d`;
          return (
            <div key={t.id} className="flex items-baseline gap-2">
              <span
                className="pixel-text flex-shrink-0"
                style={{
                  fontSize: 9,
                  color,
                  letterSpacing: "0.15em",
                  minWidth: 70,
                }}
              >
                {days.toUpperCase()}
              </span>
              <span style={{ color: "var(--foam-dim, #8fb3c4)" }}>
                {t.title}
                {t.round && (
                  <span style={{ color: "var(--kelp)" }}> · {t.round}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Draft: { ok, pass, critique: string, essayLength, truncated }
  if (name === "draft" && typeof o.critique === "string") {
    const len = typeof o.essayLength === "number" ? (o.essayLength as number) : 0;
    const pass = typeof o.pass === "number" ? (o.pass as number) : 1;
    const crit = o.critique as string;
    return (
      <div className="flex flex-col gap-1.5">
        <div style={{ color: "var(--kelp)" }}>
          — critique pass {pass} · {len} chars analyzed
          {o.truncated === true && " · truncated"}
        </div>
        <div
          style={{
            color: "var(--foam-dim, #8fb3c4)",
            fontSize: 13,
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
          }}
        >
          {crit.slice(0, 360)}
          {crit.length > 360 ? "…" : ""}
        </div>
      </div>
    );
  }

  // Bursar: { ok, bySchool: [{ school, hits[] }], totalHits }
  if (name === "bursar" && Array.isArray(o.bySchool)) {
    const bySchool = o.bySchool as Array<{ school: string; hits: LibraryHit[] }>;
    return (
      <div className="flex flex-col gap-1.5">
        <div style={{ color: "var(--kelp)" }}>
          — queried {bySchool.length} aid librar
          {bySchool.length === 1 ? "y" : "ies"} · {(o.totalHits as number) ?? 0} passages
        </div>
        {bySchool.map((row) => (
          <div key={row.school} className="flex gap-2">
            <span
              className="pixel-text flex-shrink-0"
              style={{
                fontSize: 9,
                color: "var(--brass)",
                letterSpacing: "0.15em",
                minWidth: 80,
              }}
            >
              {row.school.slice(0, 18).toUpperCase()}
            </span>
            <span style={{ color: "var(--foam-dim, #8fb3c4)" }}>
              {row.hits.length === 0
                ? "— no hits"
                : `${row.hits.length} hit${row.hits.length === 1 ? "" : "s"} · ${
                    row.hits[0].title ?? row.hits[0].source ?? "source"
                  }`}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Library-backed (Archivist/Match-Maker/Scout): { ok, hits: LibraryHit[], count }
  if (Array.isArray(o.hits)) {
    const hits = o.hits as LibraryHit[];
    const noun = name === "archivist" ? "record" : "passage";
    if (hits.length === 0) {
      return (
        <span style={{ color: "var(--kelp)" }}>
          — library empty · no {noun}s matched
        </span>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        <div style={{ color: "var(--kelp)" }}>
          — pulled {hits.length} {noun}
          {hits.length === 1 ? "" : "s"}
        </div>
        {hits.slice(0, 3).map((h, i) => (
          <div key={i} className="flex gap-2">
            <span
              className="pixel-text flex-shrink-0"
              style={{
                fontSize: 9,
                color: "var(--brass)",
                letterSpacing: "0.15em",
                maxWidth: 120,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={h.source ?? h.url ?? ""}
            >
              {(h.title ?? h.source ?? "file").slice(0, 22)}
            </span>
            <span style={{ color: "var(--foam-dim, #8fb3c4)" }}>
              {(h.text ?? "").slice(0, 140)}
              {(h.text ?? "").length > 140 ? "…" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Placeholder tools: { ok, response: string }
  if (typeof o.response === "string") {
    return (
      <span style={{ color: "var(--foam-dim, #8fb3c4)" }}>
        {(o.response as string).slice(0, 260)}
        {(o.response as string).length > 260 ? "…" : ""}
      </span>
    );
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Decorative elements (no conversation yet / loading states)
// ──────────────────────────────────────────────────────────────────────

function SystemPreamble({ hasConversation }: { hasConversation: boolean }) {
  if (hasConversation) return null;
  return (
    <>
      <Sys>— intercom primed · encryption ok · graph: 0 claims</Sys>
      <Sys>— hatch sealed · awaiting file drop</Sys>
      <Sys>— dean is on station and will hail when you board</Sys>
      <div className="mt-6" />
    </>
  );
}

function DeanHail() {
  return (
    <div className="mb-5">
      <div
        className="pixel-text mb-1"
        style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.18em" }}
      >
        DEAN ↯
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 15,
          lineHeight: 1.55,
          color: "var(--foam)",
        }}
      >
        Come in. I&apos;ve read your files before you dropped them — that&apos;s
        just what we do down here. Tell me what you&apos;re working on and I&apos;ll
        pull the right specialist from the deck.
      </p>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="mb-5 flex items-center gap-2">
      <span
        className="pixel-text"
        style={{ fontSize: 9, color: "var(--brass)", letterSpacing: "0.18em" }}
      >
        DEAN ↯
      </span>
      <span className="flex gap-1">
        {[0, 180, 360].map((d) => (
          <span
            key={d}
            className="inline-block rounded-full"
            style={{
              width: 5,
              height: 5,
              background: "var(--sonar)",
              opacity: 0.8,
              animation: `lamp-flicker 1.2s ${d}ms infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

function Sys({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="hud-text mb-1"
      style={{ fontSize: 14, color: "var(--kelp)", letterSpacing: "0.04em" }}
    >
      {children}
    </div>
  );
}
