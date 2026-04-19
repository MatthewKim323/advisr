# Seed manifests

Each `.mts` file here is a curated list of URLs we feed into Human Delta
to populate a specialist's library. These are NOT runtime data — they're
build/prep data consumed by [`scripts/seed-hd.mts`](../../../scripts/seed-hd.mts)
which calls `hd.indexes.create()` for every URL.

## Why curated (not discovered)

Most RAG demos index the whole web on-the-fly. That's slow, expensive,
and produces garbage (SEO spam, auth walls, stale pages). We decided
Match-Maker/Bursar/Scout each have a small, fixed world of sources
vetted by a human. Niche-dot-com's college profile pages are good;
their SEO category pages are not. studentaid.gov's `/apply-for-aid/fafsa`
hub is stable; a `/blog/` post from 2019 is noise. So every URL in
these files was chosen deliberately.

When you add a school to Match-Maker, you edit a file here — you don't
kick off a crawl from the product.

## The three specialists

| File              | Specialist   | Shape of seed URLs                                                    |
|-------------------|--------------|-----------------------------------------------------------------------|
| `match-maker.mts` | Match-Maker  | One Niche profile per school (`maxPages: 1`). ~23 URLs.               |
| `bursar.mts`      | Bursar       | Each target school's `/financial-aid` landing + studentaid.gov hubs.  |
| `scout.mts`       | Scout        | Scholarship directory roots, `maxPages` high so HD walks the listings.|

Archivist is intentionally absent — its library is whatever the STUDENT
uploads, not stuff we crawl ahead of time.

## Seed entry shape

See [`types.mts`](./types.mts). Every entry:

- `url` — the crawl root
- `maxPages` — HD's per-job cap. Smaller = cheaper. For single profile
  pages, set `1`; for directory roots where the value is in the
  outgoing links, set `10`–`20`.
- `name` — `<specialist>/<slug>` format. The seed CLI uses this for
  dedupe (so re-running doesn't double-index) and `hd:status` uses the
  prefix to group jobs in the report.

## Adding a school / source

1. Open the right manifest (`match-maker.mts` for college profiles,
   `bursar.mts` for aid pages, `scout.mts` for scholarships).
2. Copy an existing entry and change the URL + slug.
3. Run `npm run hd:seed:<specialist> -- --limit 1 --wait` to smoke-test
   that specific URL before the full crawl.
4. If the new source's domain isn't already in the specialist's
   `domainAllowlist` (in `lib/agents/specialists.ts`), add it there too
   — otherwise search results from the new crawl will get filtered out.

## Running a seed

```bash
cd web
npm run hd:seed:match-maker -- --dry             # print plan
npm run hd:seed:match-maker -- --limit 2 --wait  # smoke test 2 URLs, block till done
npm run hd:seed:all -- --wait                    # full seed of all three
npm run hd:status                                 # grouped report
```

Dedupe is automatic — the CLI fetches existing index jobs and skips
any whose `name` already exists. Safe to re-run anytime.
