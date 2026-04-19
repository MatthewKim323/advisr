# Human Delta in Advisr

> TL;DR — Advisr is six specialist agents. Four of them run on Human Delta.
> Every external fact the agents produce (admit rates, FAFSA rules,
> scholarship matches) and every student memory they pull (transcripts,
> essays, counselor notes) flows through one Human Delta knowledge graph.

## Why Human Delta

The hard problem in an AI college counselor isn't the chat loop — it's
grounding. Without retrieval, an LLM will happily fabricate Columbia's
admit rate, make up a scholarship, or hallucinate FAFSA deadlines. We
needed:

1. **Student memory.** Months of dropped PDFs, essays, voice memos, and
   parent W-2s, queryable by any agent in milliseconds.
2. **Vetted external knowledge.** College profiles, aid policies,
   scholarship listings — indexed once, searched on every question.
3. **No custom infra.** Hackathon timelines. We're not writing a vector
   DB or a web crawler this weekend.

Human Delta gives us all three with one API key. Drop a file, get
searchable chunks. Drop a URL, get a full crawled site. One call to
`search()` queries everything.

## Where HD lives in the repo

```
advisr/
├── HUMAN_DELTA.md                    ← you are here
│
└── web/
    ├── lib/humandelta/               ← the integration
    │   ├── README.md                 ← deep dive, data flow, design calls
    │   ├── index.ts                  ← barrel — everyone imports @/lib/humandelta
    │   ├── client.ts                 ← lazy SDK singleton + auth
    │   ├── search.ts                 ← search() + searchLibrary() (domain filter)
    │   ├── indexes.ts                ← crawlSite() + listIndexes()
    │   ├── documents.ts              ← upload / list / delete (Archivist)
    │   └── seeds/                    ← per-specialist URL manifests
    │       ├── README.md             ← how to add a school / source
    │       ├── match-maker.mts       ← ~23 curated college profile URLs
    │       ├── bursar.mts            ← financial aid pages per school
    │       └── scout.mts             ← scholarship directory roots
    │
    ├── scripts/
    │   ├── seed-hd.mts               ← CLI: npm run hd:seed:<specialist>
    │   ├── hd-status.mts             ← CLI: npm run hd:status
    │   └── hd-probe.mts              ← debug: raw search against the library
    │
    ├── app/api/archivist/            ← HTTP surface on top of documents.ts
    │   ├── upload/route.ts           ← drag-drop file → hd.documents.upload
    │   ├── documents/route.ts        ← list what's indexed
    │   ├── documents/[id]/route.ts   ← delete a record
    │   ├── search/route.ts           ← Archivist console search
    │   └── crawl/route.ts            ← index a URL
    │
    ├── components/archivist/
    │   └── ArchivistConsole.tsx      ← the student-facing intake UI
    │
    └── lib/agents/
        ├── specialists.ts            ← where domain allowlists live
        └── tools.ts                  ← librarySearchTool + bursarTool call HD
```

## Who uses HD and how

| Specialist     | HD primitive                     | Sources                                                                 |
|----------------|----------------------------------|-------------------------------------------------------------------------|
| **Archivist**  | `searchLibrary()` (no filter)    | Student's own uploads via `uploadDocument()`.                           |
| **Match-Maker**| `searchLibrary(domainAllowlist)` | `niche.com`, `collegescorecard.ed.gov`, `commondataset.org`, `ipeds`    |
| **Bursar**     | `searchLibrary()` ×N in parallel | `studentaid.gov`, `commondataset.org`, `.edu` (school aid pages)        |
| **Scout**      | `searchLibrary(domainAllowlist)` | `scholarships.com`, `goingmerry.com`, `fastweb.com`, `careeronestop.org`|

Draft and Pacer don't use HD — Draft runs its own Claude Haiku critique
pass, Pacer is pure-logic with a canonical deadline table.

## End-to-end trace of one question

```
student: "can I afford Columbia?"
    │
    ▼
Dean  (claude sonnet 4.5, orchestrator)
    │  picks tool:  bursar({ schools: ["Columbia"], question: "net price…" })
    ▼
bursarTool  (web/lib/agents/tools.ts)
    │  fans out one call per school in parallel
    ▼
searchLibrary({
  query: "Columbia — net price…",
  domainAllowlist: ["studentaid.gov", "commondataset.org", ".edu"]
})
    │
    ▼
HumanDelta SDK  →  POST /v1/search  →  hits across whole knowledge graph
    │
    ▼
filter by domainAllowlist host suffix (search.ts)
    │  drops niche.com, scholarships.com, etc.
    ▼
top 6 passages  →  back to Dean  →  synthesized response to student
```

The domain-filter approach means **all four specialists share one
library**. We index once; scoping is done at query time by post-filtering
by source URL. See `web/lib/humandelta/search.ts::searchLibrary`.

## Seeding the libraries

Libraries are empty on a fresh API key. Populate:

```bash
cd web
npm run hd:seed:match-maker -- --limit 2 --wait   # smoke test 2 URLs
npm run hd:status                                  # check what's indexed
npm run hd:seed:all -- --wait                      # full seed
```

Adding a new school / source: edit the matching file in
`web/lib/humandelta/seeds/`, then rerun the seed command. Dedupe is
automatic (job names are compared against existing).

## Design calls worth flagging

- **One key, one graph, post-filter.** HD v0.1 doesn't namespace by
  project. We took advantage — search is global, filtering per-specialist
  happens in the tool layer. Simpler than juggling N keys, and cheap at
  our scale.
- **Curated seeds over live discovery.** We pre-index a small world
  (hundreds of pages, not thousands) of sources a human verified. Demos
  better and won't return SEO spam.
- **`server-only` everywhere.** HD API keys are `hd_live_*` and can't
  ship to the browser. Every file under `lib/humandelta/` imports
  `server-only`; accidental client-side import is a build error.
- **Honesty on empty libraries.** If HD returns 0 hits for a specialist,
  the tool response carries `{ ok: true, hits: [], count: 0 }` and Dean's
  system prompt explicitly instructs him to tell the student the library
  isn't seeded rather than fabricate facts. See the live smoke test in
  the commit history — before seeding, Dean said: *"The Match-Maker
  library isn't seeded yet — so I can't pull verified CDS data."*

## Links

- [`web/lib/humandelta/README.md`](./web/lib/humandelta/README.md) —
  integration details, data flow diagram, per-file responsibilities.
- [`web/lib/humandelta/seeds/README.md`](./web/lib/humandelta/seeds/README.md) —
  how to add a school / source, rationale for curated seeds.
- [Human Delta docs](https://dev.humandelta.ai/docs/for-agents)
