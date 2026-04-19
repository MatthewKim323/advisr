# Predicate vocabulary

The authoritative list lives in code: **`web/lib/graph/predicates.ts`**.
That file is the source of truth — this page is a human-readable summary.

## Why this matters

One controlled list of ~70 predicates, written by specific workers, read
by specific downstream agents. No runtime invention. See PLAN.md §5.5 for
the full design rationale and the "straddling two cultures" / "writes about
identity" failure mode this prevents.

## Design rules

1. **Student is implicit subject** for most predicates. Simplifies queries.
2. **Compound objects** stored as JSON in the `object` column.
3. **Append-only, never update.** GPA changes? Write a new claim, mark the
   old one `status='superseded'`. Full audit trail preserved.
4. **Confidence-aware queries default to `status='confirmed'`.** Agents can
   opt in to pending explicitly.
5. **Sensitivity-tagged predicates** never surface to downstream agents
   without `status='confirmed'`, and never auto-populate UI tags.

## Growing the vocabulary

New predicates are added between versions — NEVER mid-session. Process:

1. Propose the predicate in a PR with: name, object type, which worker writes
   it, which agent reads it, sensitivity.
2. Add to `predicates.ts`.
3. If it changes a worker's output shape, update the expected-claims rubric
   for Maria (`about/08_expected_claims.md`) accordingly.
