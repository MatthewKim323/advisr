# Architecture

This is a compressed companion to `PLAN.md §4`. Canonical diagrams live there.

## Three layers

| Layer | Code path | What it does |
|---|---|---|
| **Agents** | `web/lib/agents/` | Orchestrator (Dean) + 6 specialists + Archivist workers. Vercel AI SDK `generateText` with tool use. Nested agent trees. |
| **Memory** | `web/lib/graph/` + `web/lib/db/` | Postgres knowledge graph with provenance, confidence, human-in-the-loop gate. |
| **Visualization** | `web/components/office/` | PixiJS canvas that subscribes to event bus and renders characters. |

## Data flow

```
user drops files  →  /api/upload
                  →  source_files rows + file_uploaded events

user hits process →  Archivist orchestrator
                  →  delegates to workers (Transcript, Essay, Financial, Voice, Photo, Activity)
                  →  each worker extracts artifacts → claims (status=pending)

user reviews      →  /proposals page fetches profile.pending()
                  →  PATCH /api/proposals/[id] { action: confirm|reject }
                  →  claim_confirmed events

user chats        →  Dean reads profile.summarize()
                  →  decides which specialist to call
                  →  specialist runs (often browser-use)
                  →  writes new claims (status=pending)

every step emits  →  event bus (Supabase Realtime channel "office:events")
                  →  canvas animates in real time
```

## Why a knowledge graph (not just a vector DB)

Vector search finds similar text. A graph gives us **typed relationships
with provenance**. Match-Maker doesn't need "things similar to Catholic" —
it needs `identifies_as_religion = Catholic` as a fact to filter on, with a
source file to show and a confidence to act on. Embeddings get added in
post-MVP when keyword filtering hits a wall.

## The predicate vocabulary is load-bearing

See `web/lib/graph/predicates.ts`. Without it, Scout writes
`interested_in: CS`, Draft writes `passionate_about: computer_science`, and
Match-Maker can't find either. One controlled list, ~70 predicates, no
runtime invention.

## The event bus is the VISUAL spec

Every animation on the canvas is driven by an `AgentEvent`. See
`web/lib/events/types.ts`. Never hand-animate — if the canvas needs to do
something, first make sure there's an event for it.
