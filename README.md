# Advisr — The Counseling Office

A pixel-art AI counseling office that gives every first-gen student the team
of specialists that rich kids hire for $50,000.

Read **[PLAN.md](./PLAN.md)** for the full product spec — this README is just
for finding your way around the repo.

---

## Repo layout

```
advisr/
├── PLAN.md            # Source of truth. Do not delete.
├── README.md          # You are here.
├── .env.example       # Keys expected at runtime.
├── about/             # Maria Isabel Delgado Santos — the composite student.
│                      # 8 artifacts used as demo fixtures + Archivist seed data.
├── site/              # The public landing page. Vite + React + TS, pure CSS.
│                      # Served standalone at advisr.[tld]. No backend.
├── web/               # The main application. Next.js 16 + Drizzle + Supabase.
│   ├── app/           #   Routes: /office (canvas), /proposals, /api/*
│   ├── components/    #   Office canvas, chat panel, ProposalQueue UI.
│   ├── lib/
│   │   ├── agents/    #   Dean + 6 specialists + Archivist workers.
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

1. `PLAN.md` §1–§3 — why Advisr exists, who the agents are
2. `PLAN.md` §5 + `web/lib/graph/predicates.ts` — how memory works
3. `web/lib/db/schema.ts` — the 4 tables
4. `web/lib/events/types.ts` — the pub/sub contract
5. `web/lib/agents/dean.ts` — the orchestrator shell
