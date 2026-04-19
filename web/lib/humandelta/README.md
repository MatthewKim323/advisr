# Human Delta integration

Nami is powered by the Tsunami — a team of six specialist agents. Four of them get their
domain knowledge from Human Delta — one unified semantic search layer
over everything we've crawled (schools, financial aid pages,
scholarship directories) and everything the student has uploaded
(transcripts, essays, counselor notes, W-2s).

This directory is where that integration lives. Start here if you want
to understand how Dean's specialists turn a student's question into a
retrieval call.

## What's in this folder

```
humandelta/
├── README.md         ← you are here
├── index.ts          ← barrel — all other code in the app imports from this
├── client.ts         ← lazy SDK singleton + HdNotConfigured error type
├── search.ts         ← search() + searchLibrary() with domain allowlists
├── indexes.ts        ← crawlSite() + listIndexes() (used by the seed CLI)
├── documents.ts      ← uploadDocument / list / delete (Archivist intake)
└── seeds/            ← per-specialist URL manifests we pre-index into HD
    ├── match-maker.mts
    ├── bursar.mts
    ├── scout.mts
    └── types.mts
```

## Who uses what

```
           ┌──────────────────────────────────────────────┐
           │              Human Delta API                 │
           │   (one knowledge graph, one API key)         │
           └──────────────────────────────────────────────┘
                 ▲                 ▲                ▲
     uploads     │                 │  search        │  crawls
   (documents)   │                 │ (chunks+text)  │  (index jobs)
                 │                 │                │
    ┌────────────┴─┐      ┌────────┴────────┐   ┌──┴──────────────┐
    │  Archivist   │      │ Match-Maker     │   │ seed CLI        │
    │  intake      │      │ Bursar          │   │ scripts/seed-hd │
    │  flow        │      │ Scout           │   │                 │
    └──────────────┘      │ Archivist-as-   │   │ fires on demand │
                          │ search          │   │ from `npm run   │
                          └─────────────────┘   │ hd:seed:*`      │
                                                └─────────────────┘
```

The four search-using specialists all share ONE HD library. The
separation between them is **domain filtering**, not separate libraries.
Match-Maker only accepts hits from `niche.com`, `collegescorecard.ed.gov`,
etc. Scout only accepts hits from `scholarships.com`, `careeronestop.org`,
etc. That filtering lives in `search.ts::searchLibrary`.

The exact allowlist for each specialist is declared in
`lib/agents/specialists.ts` — look for `domainAllowlist`.

## Data flow — a single question

```
student: "can I afford Columbia?"
            │
            ▼
        Dean (claude sonnet 4.5, lib/agents/dean.ts)
            │  picks tool  ·  bursar
            ▼
        bursarTool  (lib/agents/tools.ts)
            │  schools: ["Columbia"], question: "net price…"
            ▼
        searchLibrary({                            ← this file: search.ts
          query: "Columbia — net price…",
          domainAllowlist: ["studentaid.gov", "commondataset.org", ".edu"]
        })
            │
            ▼
        HumanDelta.search(query, 18)               ← via humandelta SDK
            │  returns hits from everything indexed
            ▼
        filter by domainAllowlist (host suffix)    ← search.ts
            │  drops niche.com, scholarships.com, etc.
            ▼
        top 6 passages → back up through the tool → Dean synthesizes
```

## Seeding

The specialist libraries are empty on a fresh API key. Populate them
with the seed CLI (see [`seeds/README.md`](./seeds/README.md) and
[`../../scripts/seed-hd.mts`](../../scripts/seed-hd.mts)):

```bash
npm run hd:seed:match-maker -- --limit 2 --wait   # smoke test
npm run hd:status                                  # check what's indexed
npm run hd:seed:all -- --wait                      # full seed
```

The student's library (Archivist) is seeded differently — one file at a
time through the intake chute at `/archivist`, which POSTs to
`/api/archivist/upload` → `documents.ts::uploadDocument`.

## Design decisions worth flagging

- **One API key, one knowledge graph.** HD doesn't have per-project
  namespacing in v0.1, so we use domain filtering to keep specialist
  results scoped. Works fine at hackathon scale (hundreds of pages); if
  we grow into the tens of thousands we'd need separate keys.

- **`server-only` everywhere.** The key is `hd_live_…` and CANNOT ship to
  the browser. Every file here imports `server-only` so an accidental
  import from a Client Component fails the build instead of leaking.

- **Documents surface is direct REST.** `humandelta` npm v0.1.1 exposes
  `.search()` and `.indexes.*` but not `.documents.*` — we hit the
  REST endpoint ourselves for uploads. The Python SDK has the method;
  when the JS SDK catches up we can delete `documents.ts` and import
  directly from the package.

- **Failure mode is "tell the student honestly."** If HD is unreachable
  or returns nothing, specialists return `{ ok: false, error, note }`
  and Dean is explicitly prompted to relay that to the student rather
  than fabricate numbers.
