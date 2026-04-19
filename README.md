# Nami

Board the **Bathysphere-7** — a submerged, pixel-art counseling office that
gives every first-gen student the crew of specialists — **the Tsunami** —
that rich kids hire for $50,000. Captain Dean runs the deck. Six stations
glow along the hull. The knowledge constellation floats overhead.

> Built on [Human Delta](https://humandelta.ai). Every claim Nami makes is a
> receipt you can click back to a specific chunk of the student's own files.
> That's the HD-native idea: **no chunk ID, no claim.** The knowledge graph
> is grounded by construction, not by prayer.

### Hero beat — "Tell me what I said"

1. Student types `grandmother` into the sonar bar on the office deck.
2. The Drafting station lights up: 6 hits. The Archivist's transcripts shelf
   pulses once: 1 hit.
3. Student types `robotics`. Drafting dims. The transcripts shelf lights
   HARD: 14 hits.
4. Dean, unprompted over the intercom: *"You wrote the page about your
   grandmother. You told me about robotics. Want to write what's actually
   yours?"*

That single contrast — what she wrote vs. what she said — is the whole
product thesis in one interaction. See `docs/hero-storyboard.md` for the full
45s scripted beat.

### Why this wins the HD prize

- **Dual-scope graph.** Student scope (uploaded transcripts / essays /
  activity lists) + world scope (college profiles, aid policies,
  scholarships, style guides) — same `searchGraph()` signature, different
  data, cross-linked by receipts.
- **Source-to-UI binding layer.** Every SourceKind in the graph maps to a
  concrete surface on the sub (`lib/office/surface-map.ts`). When a query
  hits a transcript chunk, the Archivist's transcripts shelf glows. Visual
  truth = graph truth.
- **No fabrication, ever.** Dean's system prompt hard-fails on invented
  claims; `lib/graph/profile.ts#render` injects `<student_profile>` every
  turn so Dean never re-asks what the graph already knows.
- **Optimistic light-up + server-echo reconciliation.** Keystroke → 150ms
  debounce → local prefix match fires first → authoritative POST /api/search
  catches up → reconcile(). The UI always feels instant; the server always
  wins ties. See `lib/stores/officeStore.ts` + `lib/office/surface-map.ts`.

Read **[PLAN.md](./PLAN.md)** for the full product spec — this README is
just for finding your way around the repo.

---

## Repo layout

```
nami/
├── PLAN.md            # Source of truth. Do not delete.
├── README.md          # You are here.
├── .env.example       # Keys expected at runtime.
├── about/             # Maria Isabel Delgado Santos — the composite student.
│                      # 8 artifacts used as demo fixtures + Archivist seed data.
├── site/              # The public landing page. Vite + React + TS, pure CSS.
│                      # Served standalone at nami.[tld]. No backend.
├── web/               # The main application. Next.js 16 + Drizzle + Supabase.
│   ├── app/           #   Routes: /office (canvas), /proposals, /api/*
│   ├── components/    #   Office canvas, chat panel, ProposalQueue UI.
│   ├── lib/
│   │   ├── agents/    #   Dean + 6 specialists (the Tsunami) + Archivist workers.
│   │   ├── graph/     #   Knowledge graph helpers + predicate vocabulary.
│   │   ├── db/        #   Drizzle schema, client, migrations.
│   │   ├── events/    #   Event bus types + Supabase Realtime wiring.
│   │   └── browser/   #   browser-use wrapper + demo-mode cache.
│   └── public/sprites #   Donarg's Office Interior asset pack lives here.
├── fixtures/          # Persona scaffolds — maria (↗ about/), james, aisha.
└── docs/
    ├── architecture.md
    ├── predicates.md
    └── demo-script.md
```

## Workstreams

| Where | What it is | Runs with |
|---|---|---|
| `site/` | Landing page — public-facing | `cd site && npm install && npm run dev` |
| `web/` | Main product | `cd web && npm install && npm run dev` |

The two are deployed independently. The landing never talks to the app except
via a "Walk into the office" CTA.

## Build phases

See **PLAN.md §8** for the full build order. TL;DR:

1. **Spine** — Next.js scaffold, DB, upload, event bus, trivial Dean.
2. **Memory layer** — Archivist + TranscriptReader end-to-end, ProposalQueue.
3. **Agents** — Match-Maker, Bursar, Draft, Scout, Pacer.
4. **Pixel office** — PixiJS canvas, state machine, browser overlay.
5. **Demo mode** — Pre-cache every browser-use call on the recording path.
6. **Content** — Maria artifacts (done), James & Aisha stubs, pitch deck.
7. **Video** — 2:30 demo video production.

## Required env

Copy `.env.example` → `web/.env.local` and fill in. You need:

- Anthropic API key (Claude Sonnet 4.5 + Haiku)
- Supabase URL + anon + service role
- browser-use cloud API key
- Voyage or OpenAI embeddings key (post-MVP; not required for demo)

## Reading order for a new contributor

1. `PLAN.md` §1–§3 — why Nami exists, who the Tsunami are
2. `PLAN.md` §5 + `web/lib/graph/predicates.ts` — how memory works
3. `web/lib/db/schema.ts` — the 4 tables
4. `web/lib/events/types.ts` — the pub/sub contract
5. `web/lib/agents/dean.ts` — the orchestrator shell
