/**
 * Dean's toolset.
 *
 * One tool per specialist. Each tool:
 *   1. Emits `agent_delegating` so the UI can light up the submarine scene.
 *   2. Emits `tool_call_started` / `tool_call_finished` so the chat UI can
 *      render in-line "DEAN → ARCHIVIST // SEARCHING…" delegation rows.
 *   3. Does its real work (library search / student-files search / pure
 *      logic), or returns an in-character placeholder for specialists whose
 *      full impls are still TODO (Draft, Pacer).
 *
 * === Retrieval model ===
 *
 * Five of six specialists are Human-Delta-backed:
 *   - Archivist   → hd.search() unfiltered (student's own library)
 *   - Match-Maker → hd.search() filtered to colleges-data domains
 *   - Bursar      → hd.search() filtered to aid-data domains, multi-school
 *   - Scout       → hd.search() filtered to scholarship-directory domains
 *
 * Two are not library-backed:
 *   - Draft   → will read student essays + run critique LLM pass (placeholder)
 *   - Pacer   → pure deadline logic against target schools + today (placeholder)
 *
 * ARCHITECTURAL NOTE — why Dean has tools instead of async spawn calls:
 *   Tool-calling lets Claude itself decide the routing, and the Vercel AI SDK
 *   multi-step loop (`stepCountIs`) lets one user message trigger
 *   [Dean thinks → calls Archivist → reads result → delegates to Match-Maker
 *    → summarizes] in a single streaming turn. Dean doesn't need any manual
 *   routing code. See: https://ai-sdk.dev/docs/foundations/tools
 */

import "server-only";
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

import {
  searchLibrary,
  type SearchResult,
} from "@/lib/humandelta";
import { emit } from "@events/bus";
import { SPECIALISTS, type Specialist } from "./specialists";
import { runPacer } from "./pacer";
import { draftSystemPrompt, type DraftPass } from "./draft";

// ──────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────

/** Wrap any async tool body so we get consistent event emission + error shape.
 *
 *  Tools MUST NOT throw — if a real backend is down we still want Dean to get
 *  a coherent message back so he can tell the student "records room lost
 *  pressure, try again in a sec" instead of crashing the whole turn. */
async function runTool<T>(
  spec: Specialist,
  input: unknown,
  impl: () => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  emit({
    type: "agent_delegating",
    from: "dean",
    to: spec.id,
    payload: input,
  });
  emit({
    type: "tool_call_started",
    agent: spec.id,
    tool: spec.id,
    input,
  });

  try {
    const data = await impl();
    emit({
      type: "tool_call_finished",
      agent: spec.id,
      tool: spec.id,
      output: data,
    });
    emit({ type: "agent_idle", agent: spec.id });
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({
      type: "agent_blocked",
      agent: spec.id,
      reason: message,
    });
    return { ok: false, error: message };
  }
}

/** Compact SearchResult → the minimal shape Dean actually uses. Keeps tokens
 *  reasonable; raw SearchResult has fields (`raw_score`, `score_kind`, etc.)
 *  that don't help Claude reason. */
type SlimHit = {
  source: string;
  url: string | null;
  score: number;
  text: string;
  title: string | null;
};

function slim(h: SearchResult): SlimHit {
  return {
    source: h.page_title ?? h.source_url ?? h.doc_id ?? "unknown",
    url: h.source_url ?? null,
    score: h.score,
    text: h.text,
    title: h.page_title ?? null,
  };
}

/** Placeholder response used for specialists whose real impl isn't live yet.
 *  Reads in-character so the demo still feels coherent — Dean hands off,
 *  placeholder replies in its voice about *not actually running yet*,
 *  Dean summarizes honestly to the student. No fake data invented. */
function placeholderReply(spec: Specialist, request: string): string {
  return [
    `[${spec.label} STATION — placeholder]`,
    `Request received: ${request}`,
    `Status: station crewed, tools offline.`,
    `Voice sample: ${spec.voiceHint}`,
    ``,
    `Relay to Dean: "I hear you. I'm not wired up yet — tell the student I'll`,
    `have real ${spec.tagline.toLowerCase().replace(/\.$/, "")} ready once my`,
    `workers ship. For now: outline the plan, don't invent numbers."`,
    `— ${spec.label}`,
  ].join("\n");
}

// ──────────────────────────────────────────────────────────────────────
// Library-backed tool factory
// ──────────────────────────────────────────────────────────────────────

/** Build a tool that forwards to hd.search() with this specialist's domain
 *  allowlist. One factory, one `execute` impl — used for Archivist (student),
 *  Match-Maker, Scout. Bursar is a special case with parallel multi-school
 *  search, see `bursarTool` below. */
function librarySearchTool(spec: Specialist) {
  const isStudent = spec.mode === "student";
  return tool({
    description: [
      spec.tagline,
      spec.brief,
      ``,
      isStudent
        ? `Call this BEFORE answering any question that might be grounded in ` +
          `the student's uploaded files. Returns ranked passages with source ` +
          `filenames. If the library is empty, you'll get an empty list — ` +
          `say so honestly rather than guessing.`
        : `Call this when the student's question needs authoritative outside ` +
          `information of this kind. Returns ranked passages pulled only from ` +
          `vetted sources. If the library returns nothing, tell the student ` +
          `the topic hasn't been seeded yet — don't fabricate.`,
      ``,
      `When to call: ${spec.invocationCues.map((c) => `"${c}"`).join(", ")}.`,
    ].join(" "),
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe(
          "Natural-language query. Phrase it the way you'd type into a " +
            "search bar. The student's own words are usually best.",
        ),
      topK: z
        .number()
        .int()
        .min(1)
        .max(12)
        .default(6)
        .describe("Max passages to return. Keep small."),
    }),
    execute: async ({ query, topK }) => {
      const res = await runTool(spec, { query, topK }, async () => {
        const hits = await searchLibrary({
          query,
          topK,
          domainAllowlist: spec.domainAllowlist,
        });
        return hits.map(slim);
      });

      if (!res.ok) {
        return {
          ok: false as const,
          error: res.error,
          note:
            `${spec.label} couldn't run — the library may not be indexed yet ` +
            `or the HD API is unreachable. Tell the student honestly; don't fabricate.`,
        };
      }
      return { ok: true as const, hits: res.data, count: res.data.length };
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Bursar — parallel multi-school library search ("5 sonar pings")
// ──────────────────────────────────────────────────────────────────────

/** Bursar gets its own signature because the visual payoff is running
 *  searches across N schools concurrently and showing them ping back in
 *  sequence. One tool-call, N parallel library queries inside. */
function bursarTool(spec: Specialist) {
  return tool({
    description: [
      spec.tagline,
      spec.brief,
      ``,
      `Call this with a list of schools (1-5) the student is weighing and a ` +
        `question about cost/aid. Bursar runs one aid-library query per ` +
        `school in parallel and returns per-school passages. Then YOU ` +
        `synthesize the comparison for the student.`,
      ``,
      `When to call: ${spec.invocationCues.map((c) => `"${c}"`).join(", ")}.`,
    ].join(" "),
    inputSchema: z.object({
      schools: z
        .array(z.string().min(1))
        .min(1)
        .max(5)
        .describe("Target school names, 1-5. Use the common name (e.g. 'UCLA', not 'University of California, Los Angeles')."),
      question: z
        .string()
        .min(1)
        .describe(
          "What you want Bursar to compare across schools. E.g. 'net price " +
            "for a family earning $55k' or 'how generous is institutional aid'.",
        ),
      perSchoolK: z
        .number()
        .int()
        .min(1)
        .max(6)
        .default(3)
        .describe("Max passages per school. Keep small — 3 is plenty."),
    }),
    execute: async ({ schools, question, perSchoolK }) => {
      const res = await runTool(
        spec,
        { schools, question, perSchoolK },
        async () => {
          // Fan out one library search per school. These run concurrently —
          // the per-tool event emits are staggered by HD latency, which is
          // what gives us the "5 sonar pings arriving at different times"
          // feel in the UI. We DON'T wrap each inner search in its own
          // `tool_call_started/finished` — that would be a nested tool call
          // which Claude doesn't know about. Instead we emit progress events.
          const perSchool = await Promise.all(
            schools.map(async (school) => {
              emit({
                type: "tool_call_progress",
                agent: spec.id,
                tool: spec.id,
                message: `querying aid library for ${school}`,
              });
              const hits = await searchLibrary({
                query: `${school} — ${question}`,
                topK: perSchoolK,
                domainAllowlist: spec.domainAllowlist,
              });
              return { school, hits: hits.map(slim) };
            }),
          );
          return perSchool;
        },
      );

      if (!res.ok) {
        return {
          ok: false as const,
          error: res.error,
          note:
            `Bursar couldn't reach the aid library. Tell the student honestly; ` +
            `don't guess at net prices.`,
        };
      }
      const totalHits = res.data.reduce((n, s) => n + s.hits.length, 0);
      return {
        ok: true as const,
        bySchool: res.data,
        totalHits,
      };
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Pacer — pure-logic deadline task list
// ──────────────────────────────────────────────────────────────────────

function pacerTool(spec: Specialist) {
  return tool({
    description: [
      spec.tagline,
      spec.brief,
      ``,
      `Call this whenever the student asks about deadlines, what's due, ` +
        `pacing, or "am I behind." Pacer is pure-logic — no LLM, no library ` +
        `— it just knows the canonical admission/aid dates and computes ` +
        `what's urgent relative to today and the student's grad year.`,
      ``,
      `IMPORTANT: You MUST provide a graduationYear. If the student hasn't ` +
        `told you, ask ONE clarifying question before calling. Don't guess.`,
      ``,
      `When to call: ${spec.invocationCues.map((c) => `"${c}"`).join(", ")}.`,
    ].join(" "),
    inputSchema: z.object({
      graduationYear: z
        .number()
        .int()
        .min(2024)
        .max(2035)
        .describe("The year the student graduates high school. Required."),
      schools: z
        .array(z.string().min(1))
        .max(20)
        .default([])
        .describe(
          "Optional list of target school names. If empty, Pacer returns " +
            "every curated school's deadlines plus universal ones.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(15)
        .default(8)
        .describe("Max tasks to return — already urgency-sorted."),
    }),
    execute: async ({ graduationYear, schools, limit }) => {
      const res = await runTool(
        spec,
        { graduationYear, schools, limit },
        async () => {
          const out = runPacer({ graduationYear, schools });
          // Trim the task list to `limit` AFTER sorting — the first N are
          // the most urgent. Claude doesn't need 30 items.
          return { ...out, tasks: out.tasks.slice(0, limit) };
        },
      );
      if (!res.ok) return { ok: false as const, error: res.error };
      return { ok: true as const, ...res.data };
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Draft — essay critique (dedicated Haiku pass)
// ──────────────────────────────────────────────────────────────────────

/** Soft cap on essay length passed to Draft. Common App is 650, UC PIQs are
 *  350 each. 4000 chars (~1000 words) is generous headroom. Anything longer
 *  gets truncated with a note to the student so critique stays focused. */
const DRAFT_MAX_ESSAY_CHARS = 4000;

function draftTool(spec: Specialist) {
  return tool({
    description: [
      spec.tagline,
      spec.brief,
      ``,
      `Call this with the essay text the student wants critiqued. Optionally ` +
        `set \`pass\` to control depth: 1 = big-picture (default), 2 = ` +
        `sentence-level, 3 = polish. Draft runs its own LLM pass and returns ` +
        `a critique — you then relay the key points to the student in your ` +
        `own voice.`,
      ``,
      `Draft does NOT rewrite the essay. It points at what's weak and suggests ` +
        `moves. Do NOT rewrite either — the student's voice is the product.`,
      ``,
      `When to call: ${spec.invocationCues.map((c) => `"${c}"`).join(", ")}.`,
    ].join(" "),
    inputSchema: z.object({
      essayText: z
        .string()
        .min(80)
        .describe(
          "The full text of the essay to critique. Must be 80+ chars. If " +
            "the student referenced an essay in their library, pull it " +
            "with `archivist` first, then paste the passage here.",
        ),
      pass: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(1)
        .describe(
          "Critique depth. 1 = big-picture (structure, thesis, clichés). " +
            "2 = sentence-level (voice, show-don't-tell). " +
            "3 = polish. Start at 1 unless the student asks for deeper.",
        ),
      schoolContext: z
        .string()
        .optional()
        .describe(
          "Optional — e.g. 'Common App personal statement', 'UC PIQ #2 on " +
            "leadership', 'Stanford what matters'. Helps Draft judge relevance.",
        ),
    }),
    execute: async ({ essayText, pass, schoolContext }) => {
      const truncated = essayText.length > DRAFT_MAX_ESSAY_CHARS;
      const body = truncated
        ? essayText.slice(0, DRAFT_MAX_ESSAY_CHARS)
        : essayText;

      const res = await runTool(
        spec,
        { pass, schoolContext, essayLength: essayText.length, truncated },
        async () => {
          const { text } = await generateText({
            model: anthropic("claude-haiku-4-5"),
            system: draftSystemPrompt(pass as DraftPass, schoolContext),
            prompt: [
              `Essay to critique:`,
              ``,
              body,
              ``,
              truncated
                ? `[NOTE: this essay was ${essayText.length} chars; only the first ${DRAFT_MAX_ESSAY_CHARS} were shown to you. Focus on what's here.]`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
            // Keep critique focused — cap tokens so Draft doesn't sprawl.
            maxRetries: 2,
          });
          return {
            pass,
            critique: text.trim(),
            essayLength: essayText.length,
            truncated,
          };
        },
      );

      if (!res.ok) {
        return {
          ok: false as const,
          error: res.error,
          note:
            "Draft couldn't run — the critique model is unreachable. Relay " +
            "honestly; don't paraphrase feedback you didn't get.",
        };
      }
      return { ok: true as const, ...res.data };
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Placeholder tool factory (no specialists currently use this — kept for
// future-added agents.)
// ──────────────────────────────────────────────────────────────────────

function placeholderTool(spec: Specialist) {
  return tool({
    description: [
      spec.tagline,
      spec.brief,
      `Call when the student says something like: ` +
        spec.invocationCues.map((c) => `"${c}"`).join(", ") +
        ".",
    ].join(" "),
    inputSchema: z.object({
      request: z
        .string()
        .min(1)
        .describe(
          "What you want the specialist to do, in plain language. Be specific " +
            "about the student's ask.",
        ),
    }),
    execute: async ({ request }) => {
      const res = await runTool(spec, { request }, async () => {
        // Deliberate small delay so the UI has time to show the delegation
        // animation. 600ms = roughly one sprite-walk + desk-sit in the office.
        await new Promise((r) => setTimeout(r, 600));
        return placeholderReply(spec, request);
      });
      if (!res.ok) return { ok: false as const, error: res.error };
      return { ok: true as const, response: res.data };
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Toolset assembled for Dean
// ──────────────────────────────────────────────────────────────────────

/** Dean's concrete toolset. Keys match character IDs so the event stream
 *  and tool-call part names line up in the UI. */
export function buildDeanTools() {
  return {
    archivist: librarySearchTool(SPECIALISTS.archivist),
    "match-maker": librarySearchTool(SPECIALISTS["match-maker"]),
    bursar: bursarTool(SPECIALISTS.bursar),
    scout: librarySearchTool(SPECIALISTS.scout),
    draft: draftTool(SPECIALISTS.draft),
    pacer: pacerTool(SPECIALISTS.pacer),
  } as const;
}
