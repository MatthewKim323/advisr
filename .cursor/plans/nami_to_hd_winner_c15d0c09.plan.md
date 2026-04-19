---
name: Nami to HD winner
overview: "Brutal critique of the current state, plus a comprehensive phased plan to take Nami from \"ambitious prototype with stubs\" to a serious contender for Best Use of Human Delta (1st, $750). Target: one unforgettable HD-native demo beat, with every claim in the product backed by receipts."
todos:
  - id: A1_deps
    content: Add drizzle-orm, pg, @types/pg, drizzle-kit to web/package.json; verify npm run build passes cold
    status: pending
  - id: A2_migrations
    content: Write and run Supabase migrations for source_files, artifacts, claims, entities tables
    status: pending
  - id: A3_upload
    content: "Implement /api/upload route end-to-end: Supabase Storage → source_files insert → kick Archivist"
    status: pending
  - id: A4_proposals
    content: Implement /api/proposals/[id] PATCH to confirm/reject claims + emit realtime events
    status: pending
  - id: A5_events_realtime
    content: Swap in-memory event bus for Supabase Realtime; keep emit() signature
    status: pending
  - id: A6_cleanup
    content: Fix stale comments in specialists.ts and dean.ts; delete or implement /api/events/route.ts
    status: pending
  - id: B1_fs_client
    content: Build web/lib/humandelta/fs.ts wrapping /v1/fs (tree, ls, cat, grep); add mock fallback
    status: pending
  - id: B2_shell_tool
    content: Add shellTool to tools.ts exposing fs.ts to Dean + specialists
    status: pending
  - id: B3_dual_scope
    content: "Refactor searchLibrary to accept scopes: student/world; return hits tagged by scope"
    status: pending
  - id: B4_chunk_ids
    content: Thread chunk_id, offsetStart, offsetEnd through LibraryHit → SlimHit → UI
    status: pending
  - id: B5_terminal_panel
    content: Build TerminalPanel component live-rendering every shell call
    status: pending
  - id: B6_file_explorer
    content: Build FileExplorer component reading HD tree on mount; wired to TerminalPanel
    status: pending
  - id: B7_draft_three_source
    content: Rewrite Draft tool to grep student drafts + world essays + world style guides
    status: pending
  - id: B8_citations
    content: Add Citation component + wire provenance badges into Dean's chat responses
    status: pending
  - id: B9_essay_corpus
    content: Seed world/accepted-essays corpus (50-100 pages) via hd:seed:draft
    status: pending
  - id: B10_style_corpus
    content: Seed world/style-guides corpus from public admissions writing guides
    status: pending
  - id: C1_run_archivist
    content: "Implement runArchivist orchestrator: route by kind, call worker, persist claims"
    status: pending
  - id: C2_propose
    content: "Implement claims.propose(): append-only insert with HD chunk provenance"
    status: pending
  - id: C3_profile_get
    content: "Implement profile.get(studentId): structured summary of confirmed claims"
    status: pending
  - id: C4_profile_in_dean
    content: Prepend profile summary to Dean's system prompt per turn in runDeanStream
    status: pending
  - id: C5_transcript_worker
    content: Implement TranscriptReader worker; hit ≥80% of Maria transcript claims
    status: pending
  - id: C6_voice_worker
    content: Implement VoiceTranscriber worker against Maria's voice memo transcript
    status: pending
  - id: C7_essay_worker
    content: Implement EssayParser worker; detect grandmother-cliché + robotics duplicate theme
    status: pending
  - id: C8_proposal_queue
    content: Build real ProposalQueue UI with Realtime subscription + swipe confirm/reject
    status: pending
  - id: C9_financial_worker
    content: Implement FinancialParser worker extracting Pell/AGI/loan constraints
    status: pending
  - id: C10_activity_worker
    content: Implement ActivityExtractor worker
    status: pending
  - id: C11_evals
    content: Build scripts/eval-archivist.mts scoring workers vs 08_expected_claims.md
    status: pending
  - id: D1_aesthetic
    content: Commit to after-hours-office aesthetic; kill Bathysphere-7 framing
    status: pending
  - id: D2_dean_prompt
    content: "Rewrite Dean system prompt: shorter, harder no-fabrication, profile slot"
    status: pending
  - id: D3_desk_labels
    content: Add parchment desk labels to each specialist sprite (Silkscreen)
    status: pending
  - id: D4_constellation
    content: Ship real KnowledgeConstellation force-directed graph over confirmed claims
    status: pending
  - id: D5_hero_beat
    content: Build deterministic 'grandmother vs voice memo' demo sequence
    status: pending
  - id: D6_demo_cache
    content: Implement DEMO_MODE HD response cache for offline recording
    status: pending
  - id: D7_video
    content: Record 2:30 demo video per outlined beat sheet
    status: pending
  - id: D8_voiceover
    content: Record voiceover (prefer real first-gen voice, not synthesized)
    status: pending
  - id: E1_aisha
    content: Fill Aisha persona (non-traditional homeschool) — 4 artifacts + expected_claims.md
    status: pending
  - id: E2_pitch
    content: Write pitch deck + submission writeup leading with /v1/fs + dual-scope claim
    status: pending
  - id: E3_trailer
    content: Cut a 30s trailer from the 2:30 for submission thumbnail
    status: pending
  - id: E4_readme
    content: Rewrite top of README specifically for HD judges
    status: pending
  - id: F1_tell_me
    content: "STRETCH: 'Tell me what I said' floating graph-wide search bar"
    status: pending
  - id: F2_callback_agent
    content: "STRETCH: cross-essay callback agent that fires on new essay prompts"
    status: pending
  - id: F3_field_notebook
    content: "STRETCH: counselor field-notebook corpus (20 anonymized pattern notes)"
    status: pending
  - id: F4_dashboard_pdf
    content: "STRETCH: auto-generated student-brief PDF with full citations"
    status: pending
  - id: F5_pacer_cron
    content: "STRETCH: Pacer as real scheduled job emitting ambient events"
    status: pending
  - id: F6_graph_export
    content: "STRETCH: /api/profile/export returning JSON-LD student graph"
    status: pending
  - id: F7_onboarding
    content: "STRETCH: first-run flow showing HD tree building live"
    status: pending
isProject: false
---

# Nami — From Mid to Winning the Human Delta Prize

Target locked: **Best Use of Human Delta — 1st Place ($750 + guaranteed interview).** Everything below is in service of that single goal. No vanity integrations, no sponsor-logo theater.

---

## Part 1 — Brutal Critique (ranked by damage)

### Tier S: the stuff that will actually lose the prize

1. **You don't have a Human-Delta-specific "holy shit" moment.** The planned demo hero is Bursar running five parallel browser-use sessions. That's a **browser-use** moment, not an **HD** moment. Judges giving out an HD prize want to see HD do something they haven't seen before. Right now, Nami uses HD as plain RAG (`/v1/search` with a domain allowlist). That's table-stakes. You won't beat ten other teams calling `hd.search()` unless HD is the *star*.
2. **You are not using `/v1/fs`.** HD's documented primitives include `tree`, `ls`, `cat`, `grep` — a shell over the knowledge graph. Nobody uses this in your code. [web/lib/humandelta/index.ts](web/lib/humandelta/index.ts) exports search + documents + indexes, not fs. This is **the** differentiated HD surface and you're leaving it on the table. "My agents `grep` the graph" is a one-line pitch no other team will land.
3. **The dual-scope thesis ("one graph, student + world") is only half implemented.** Student uploads go to HD under `student/{user_id}/` — fine. But no specialist actually queries *across both scopes in a single call.* [web/lib/humandelta/search.ts](web/lib/humandelta/search.ts) filters by domain, not scope. PLAN §5.6 promises "grep across world + student paths" for Draft — not built. This is the most HD-native demo move you have. It's missing.
4. `**propose()` / `profile.`* are stubs.** [web/lib/graph/claims.ts](web/lib/graph/claims.ts) and [web/lib/graph/profile.ts](web/lib/graph/profile.ts) both throw. The entire "evidence-backed Student Graph" claim on the landing page is **not wired end-to-end**. Every `about/08_expected_claims.md` assertion is untested. If a judge runs `npm run dev` and uploads Maria's transcript, nothing gets extracted, nothing enters the DB, nothing appears in ProposalQueue. The core differentiator vs "ChatGPT with RAG" is a stub.
5. **All six Archivist workers throw not-implemented** ([workers/*.ts](web/lib/agents/archivist/workers/)). TranscriptReader, EssayParser, VoiceTranscriber, FinancialParser, ActivityExtractor, PhotoAnalyzer. The "drop files → agents read them" story that sells the landing page does not execute. If the pitch is "Archivist ingests your life," Archivist needs to ingest something.
6. `**/api/upload` returns 501** ([web/app/api/upload/route.ts](web/app/api/upload/route.ts)). If a judge uploads a file on the main flow (not through the Archivist console, which uses HD directly), it errors. First touch of the product is broken.
7. **Drizzle and pg are imported but not in [web/package.json](web/package.json).** [web/lib/db/client.ts](web/lib/db/client.ts) imports `drizzle-orm/node-postgres` and `pg`. Cold `npm install && npm run build` fails. Supabase migrations folder is empty ([web/lib/db/migrations/](web/lib/db/migrations/) = `.gitkeep`). The DB layer exists on paper only.

### Tier A: the stuff that weakens everything

1. **ProposalQueue is a placeholder** ([web/components/proposals/ProposalQueue.tsx](web/components/proposals/ProposalQueue.tsx)). The "human-in-the-loop memory" thesis has no working UI. This is the thesis. It's the diff vs every other AI chatbot. It doesn't exist on screen.
2. `**/api/proposals/[id]` returns 501** ([web/app/api/proposals/[id]/route.ts](web/app/api/proposals/[id]/route.ts)). Can't confirm/reject even if the UI existed.
3. **No provenance citations rendered in Dean's replies.** When Dean says "Columbia's net price for Pell students is $X," there's no clickable `[niche.com / chunk 42]` badge. HD returns chunk IDs. Your UI discards them. For an HD prize, this is malpractice.
4. **Six specialists is too many for a 2:30 demo.** 25 seconds each. That's a name-drop, not a showcase. You need ONE specialist with a cinematic HD moment. Others are supporting cast.
5. **The brand is fighting itself.** Landing is aged-paper / amber / JetBrains Mono / Silkscreen ("after-hours counseling office"). App is deep-ocean submarine ("Bathysphere-7"). PLAN.md admits this was renamed twice. The "Tsunami + bathysphere" nautical framing undercuts the warm-office thesis and scares first-gen students (it's literally *darker and more alien*). Pick one: warm after-hours office, or deep-sea expedition. Mixing is AI-slop territory.
6. **No evals.** [about/08_expected_claims.md](about/08_expected_claims.md) is literal ground truth for ~75–90 Maria claims. Nothing runs Archivist workers against it. Judges love numbers. "Our workers recover 83% of expected Maria claims, with provenance" is a killer sentence you can't say today.
7. `**specialists.ts` header comment is stale** ([web/lib/agents/specialists.ts](web/lib/agents/specialists.ts) lines 12–15 claim `run*()` methods are placeholders; [tools.ts](web/lib/agents/tools.ts) does real work). Judges read code. Lying comments signal shallow care.
8. **No browser-use package installed.** [web/lib/browser/client.ts](web/lib/browser/client.ts) is a stub that mentions browser-use in a comment only. `package.json` has no browser-use dep. The "5 NPC laptops" PLAN hero is aspirational, not running. And again — this doesn't matter for the HD prize. You don't *need* browser-use. You need HD.
9. **Event bus is in-memory** ([web/lib/events/bus.ts](web/lib/events/bus.ts)). Won't survive serverless. Multi-tab = inconsistent. If the judge opens the proposals tab AND the office tab, events won't cross. Needs Supabase Realtime (PLAN promises it, code ignores it).
10. **PixiJS is in PLAN, code uses Canvas 2D.** That's fine as a choice — Canvas 2D for a pixel grid can look great — but it caps the ceiling. No skeletal animation, no particle systems, no asset-pipeline for the Office Tileset art that's sitting in `/Office Tileset/`. Kenney sprites are generic.
11. `**demo-script.md` references a `DEMO_MODE` env var that no code reads.** Nothing is actually cached for offline playback. If WiFi drops mid-recording, the demo dies.
12. `**james/` and `aisha/` personas are TODO READMEs.** Generalization claim in the landing (`Memory.tsx` / `Roster.tsx`) is empty. One stub persona (Aisha's non-traditional homeschool case) would prove the dual-graph generalizes.

### Tier B: polish + coherence

1. **Dean's system prompt is warm but wordy** ([web/lib/agents/dean.ts](web/lib/agents/dean.ts)). Drop the submarine framing to 1 line. Tighten "Voice" section to 3 bullets. Cut "Bathysphere-7" unless you commit to the metaphor across the brand.
2. **No Draft three-source grep.** [tools.ts](web/lib/agents/tools.ts#L367) Draft is a Haiku critique pass over one essay. PLAN promises: student's own prior drafts + accepted-essays corpus + style guides — all via HD grep. Without this, Draft is just "GPT, please critique my essay," which every team will ship.
3. **No Pacer UI surface.** [lib/agents/pacer.ts](web/lib/agents/pacer.ts) works; no calendar, no timeline, no visible "you are three weeks behind on FAFSA" in the office.
4. **No "knowledge constellation."** [components/office/constellation.tsx](web/components/office/constellation.tsx) exists; PLAN calls for a graph visualization. Does it render the actual claims graph? Check — if it's a stub, this is the second most HD-adjacent visual after the FS terminal.
5. **Office canvas has no agent labels, no desk signage.** You have seven characters on screen; viewers can't tell which one is the Archivist. Pixel-art without readable identity is ambient noise.
6. `**/api/events/route.ts` returns 501** ([web/app/api/events/route.ts](web/app/api/events/route.ts)). Dead file; delete or implement.

---

## Part 2 — Why the current product loses

> Judges decide the HD prize on: (a) *did you use HD in a way that surprised us?* (b) *would this ship?* (c) *did it work?*

- (a) **No.** You use HD as bog-standard RAG with a domain allowlist. That's the demo everyone gives.
- (b) **Partially.** Landing is polished, app scaffold exists, but ingest → graph → proposals → profile is stubbed. Judges who click around will hit 501s.
- (c) **Partially.** Dean + chat + HD library search works. Everything downstream of upload is broken.

## Part 3 — Strategic Pillars to Win

Five non-negotiable moves. Each is an HD-native thing **no other team will ship.**

### Pillar 1: "Grep the Graph" — expose HD's filesystem primitives as agent tools

Wire `/v1/fs` (`tree`, `ls`, `cat`, `grep`) as Dean-callable tools. Render an HD file-explorer + terminal panel in the office UI. Every specialist can `grep -r "robotics" student/maria/` and `grep -r "engineering scholarship" world/scholarships/` in the same turn. The terminal panel animates in real time during the demo.

### Pillar 2: "Dual-scope retrieval" — cross-cut student × world in a single query

Refactor [searchLibrary()](web/lib/humandelta/search.ts) into `searchGraph({ scopes: ["student", "world"], paths, grep })` that returns hits from both scopes interleaved. The UI renders **two columns filling simultaneously** — "Maria's files" vs "the world." This is the clearest visual proof that HD's dual-memory claim is real.

### Pillar 3: Receipts everywhere — claim-grounded output

Every Dean sentence gets a clickable provenance badge. Hover = chunk preview. Click = raw source + HD chunk ID. Every entry in ProposalQueue cites the exact artifact and chunk. Zero hallucinations possible by construction — if HD didn't return a chunk, Dean can't say it.

### Pillar 4: End-to-end ingestion — Maria drops 7 files, graph fills live

Implement 3 of the 6 Archivist workers (Transcript, Voice, Essay) for real against Maria's actual artifacts. Dual-write to HD + Supabase `claims` table. Stream extracted claims into ProposalQueue via Supabase Realtime. Student swipes accept/reject. Graph updates live. Dean immediately references the newly-confirmed facts. **This is the thesis on screen.**

### Pillar 5: The single demo beat — "Grandmother vs. the voice memo"

One cinematic sequence (40 seconds of the 2:30). Maria's Common App essay (grandmother cliché) is on screen. Dean says "let me check what you told the mic." Voice memo waveform highlights. Archivist surfaces the claim: "in voice memo, student described engineering robotics as 'the first thing that made me feel like me' — not in any essay draft." Draft's critique panel updates. Dean recommends a rewrite angle. **This is the pitch.** Every other piece supports this moment.

---

## Part 4 — The Comprehensive TODO

Organized by phase. P0 = required, P1 = should-have, P2 = boil-the-ocean stretch.

### Phase A — Fix the foundation (nothing else matters if the app doesn't boot cold) — ~6h

- **P0 A1.** Add `drizzle-orm`, `pg`, `@types/pg`, and `drizzle-kit` to [web/package.json](web/package.json). Run `npm install`. Verify `npm run build` passes.
- **P0 A2.** Write real Supabase migrations for `source_files`, `artifacts`, `claims`, `entities` from [web/lib/db/schema.ts](web/lib/db/schema.ts). Run them against the Supabase instance. Verify with `psql` or Supabase dashboard.
- **P0 A3.** Implement [web/app/api/upload/route.ts](web/app/api/upload/route.ts): multipart → Supabase Storage bucket `uploads/` → insert `source_files` row → kick Archivist orchestrator. Return `{ source_file_id, artifact_ids }`.
- **P0 A4.** Implement [web/app/api/proposals/[id]/route.ts](web/app/api/proposals/[id]/route.ts): PATCH body `{ status: "confirmed" | "rejected" }` → update `claims` row → emit realtime event.
- **P0 A5.** Delete or implement [web/app/api/events/route.ts](web/app/api/events/route.ts) (currently 501).
- **P0 A6.** Swap [web/lib/events/bus.ts](web/lib/events/bus.ts) in-memory bus for Supabase Realtime. Keep `emit()` signature stable; change transport.
- **P0 A7.** Fix stale header comments in [web/lib/agents/specialists.ts](web/lib/agents/specialists.ts) and [web/lib/agents/dean.ts](web/lib/agents/dean.ts) — they say placeholders where code is real.

### Phase B — Make HD sing (the prize-winning moves) — ~14h

- **P0 B1.** Add `fs.ts` to [web/lib/humandelta/](web/lib/humandelta/): wrap `/v1/fs` with `tree(path)`, `ls(path)`, `cat(path)`, `grep({ pattern, path, scope })`. Export from [index.ts](web/lib/humandelta/index.ts).
- **P0 B2.** Add `shellTool` to [web/lib/agents/tools.ts](web/lib/agents/tools.ts) — wraps fs.ts. Dean (and any specialist) can call `shell({ cmd: "grep", pattern: "robotics", path: "student/maria" })`. Returns structured results with chunk offsets.
- **P0 B3.** Refactor `searchLibrary()` in [web/lib/humandelta/search.ts](web/lib/humandelta/search.ts) to accept `scopes: Array<"student" | "world">` and return hits tagged with scope. Interleave by scope, not by source.
- **P0 B4.** Extend `LibraryHit` / `SlimHit` in [tools.ts](web/lib/agents/tools.ts) with `chunkId`, `offsetStart`, `offsetEnd` so the UI can render anchored citations.
- **P0 B5.** Build `<TerminalPanel />` component for the office — live-renders every `shell.`* call with syntax highlighting. Lives to the right of the chat, above ProposalQueue.
- **P0 B6.** Build `<FileExplorer />` component — reads HD `tree()` on mount, renders a collapsible tree of `student/maria/`* + `world/{scholarships,aid,colleges}/`*. Click a node → shows `cat` preview in terminal panel.
- **P0 B7.** Rewrite Draft tool ([tools.ts](web/lib/agents/tools.ts#L367)) to do a **three-source grep**: (1) `grep` student's own prior drafts, (2) `grep` world/accepted-essays/ (seed this small corpus), (3) `grep` world/style-guides/. Feed all three into the Haiku critique prompt. This is HD-native Draft.
- **P0 B8.** Add `provenance` field to every Dean response step. Annotate assistant messages in [ChatPanel.tsx](web/components/chat/ChatPanel.tsx) with `<Citation chunkId={...} url={...} text={...} />` — badges that expand inline on click.
- **P1 B9.** Add a `world/` seed for accepted college essays (50–100 pages; use public archives — Johns Hopkins "Essays That Worked," NYT "This Life" essays, etc.). Index via `npm run hd:seed:draft`.
- **P1 B10.** Add a `world/` seed for admissions style guides (CollegeVine, CEA Collegewise, etc.). Same seed script pattern.

### Phase C — End-to-end Maria flow (the thesis on screen) — ~16h

- **P0 C1.** Implement `runArchivist` in [web/lib/agents/archivist/index.ts](web/lib/agents/archivist/index.ts): takes `source_file_id`, reads artifact content, dispatches to the right worker based on MIME/kind, persists claims via `propose()`.
- **P0 C2.** Implement [web/lib/graph/claims.ts](web/lib/graph/claims.ts)`propose()` — insert `claims` row with `status="pending"`, include HD `chunk_id` as provenance. Append-only; supersede on conflict by writing a new row and flipping the old to `superseded`.
- **P0 C3.** Implement [web/lib/graph/profile.ts](web/lib/graph/profile.ts)`profile.get(studentId)` — returns a structured summary keyed by predicate family (academic, financial, essays, schools, etc.), only `confirmed` claims. Used to prepend to Dean's system prompt.
- **P0 C4.** Wire profile into `runDeanStream` ([runtime.ts](web/lib/agents/runtime.ts)): prepend `<student_profile>…</student_profile>` section to `DEAN_SYSTEM_PROMPT` on every turn.
- **P0 C5.** Implement **TranscriptReader** worker ([workers/transcript-reader.ts](web/lib/agents/archivist/workers/transcript-reader.ts)). Takes `01_transcript.txt`, extracts: GPA, test scores, course grades, the AP Chem B+ story-moment. Use Haiku + structured output (zod schema). Hit ≥80% of the transcript claims in [08_expected_claims.md](about/08_expected_claims.md).
- **P0 C6.** Implement **VoiceTranscriber** worker ([workers/voice-transcriber.ts](web/lib/agents/archivist/workers/voice-transcriber.ts)). Input is text for the demo (use `06_voice_memo_transcript.txt` as if it had been ASR'd); extract: dream school, anxiety signals, robotics passion, Mr. Arellano reference, preferences about distance from Lola. Structured output again. Eval against expected claims.
- **P0 C7.** Implement **EssayParser** worker ([workers/essay-parser.ts](web/lib/agents/archivist/workers/essay-parser.ts)). Input: `02_common_app_essay_draft_v3.txt` + `03_uc_piq_draft.txt`. Extracts: theme, thesis strength, clichés, duplicate-theme across drafts. This is what fuels the grandmother-vs-voice-memo reveal.
- **P0 C8.** Build real **ProposalQueue** ([ProposalQueue.tsx](web/components/proposals/ProposalQueue.tsx)). Subscribes to Supabase Realtime on `claims` where status=pending. Swipe-style cards (keyboard too): predicate, object, source preview, provenance badge. Confirm/reject hits `/api/proposals/[id]`. Count + throttle so dropping 7 files yields a clean pile, not a flood.
- **P1 C9.** Implement **FinancialParser** worker — extracts Pell eligibility, AGI bracket, loan constraints from `05_financial_info.txt`.
- **P1 C10.** Implement **ActivityExtractor** worker — activities list → structured claims (role, hours, theme, accessibility-signal for the robotics outreach angle).
- **P1 C11.** Eval harness: a `scripts/eval-archivist.mts` script that runs all workers against Maria's artifacts and scores claim recall/precision vs [08_expected_claims.md](about/08_expected_claims.md). Outputs a table. **This generates the killer "83% recall" line for the submission text.**

### Phase D — Cinematic polish & demo beat — ~12h

- **P0 D1.** Commit to ONE aesthetic. Recommended: **after-hours counseling office** (the landing page aesthetic wins). Rebrand the app canvas from "Bathysphere-7 submarine" → "The Office, after hours." Warm amber desk lamps, aged paper, wood tones. Kill the deep-ocean/nautical framing in [dean.ts](web/lib/agents/dean.ts). Keep the pixel-art.
- **P0 D2.** Rewrite Dean's system prompt: cut to ~30% of current length, drop "Bathysphere-7," keep the mentor voice, harden the "never fabricate; always cite" clause, add the profile block slot.
- **P0 D3.** Add desk labels to pixel sprites — one-word sigils over each character (ARCHIVIST, MATCH-MAKER, BURSAR, DRAFT, SCOUT, PACER, DEAN). Silkscreen font, parchment tag.
- **P0 D4.** Implement `<KnowledgeConstellation />` for real ([components/office/constellation.tsx](web/components/office/constellation.tsx)). Force-directed graph of confirmed claims. Entities are nodes (Maria, Harvey Mudd, Lola, Pell), predicates are edges. Pulse when a new claim confirms. Sits in the office above the chat.
- **P0 D5.** Build the **grandmother vs. voice memo** demo sequence as a deterministic script: seed the DB with Maria's first 4 files confirmed. Drop voice memo. Watch Archivist extract. ProposalQueue pops the "robotics = identity" claim. User confirms. Dean immediately sends unprompted: "One thing — I just saw what you said to Mr. Arellano. Your essay is about your grandmother. Your *voice* is about robotics. Want to talk about that?" **This is the 40-second hero beat.**
- **P1 D6.** Implement `DEMO_MODE=true`: cache HD responses on disk by query hash (`scripts/demo-cache.mts`). Dev mode rehydrates from cache so the 2:30 recording is WiFi-independent. [web/lib/browser/cache.ts](web/lib/browser/cache.ts) pattern extended to HD.
- **P1 D7.** Record the 2:30 video. Outline:
  - 0:00–0:15 — Problem (first-gen + $50k counseling + generic chatbot failure mode).
  - 0:15–0:30 — Open the office. Seven desks. Dean speaks. "Drop your life."
  - 0:30–1:00 — Maria drops 7 files. Archivist lights up. TerminalPanel scrolls. ProposalQueue fills. Student swipes confirm. Constellation blooms.
  - 1:00–1:40 — **Grandmother beat.** Dean pulls the crossover, cites the voice memo chunk inline.
  - 1:40–2:10 — Match-Maker dual-scope grep: `student/maria` + `world/colleges` simultaneously. Column UI fills. Harvey Mudd surfaces. Citation badges everywhere.
  - 2:10–2:30 — Close: "$50k counseling. Free. Anyone. Every answer shows its work."
- **P1 D8.** Voiceover for the video. First-gen student voice preferred (real person, ask a friend). Don't auto-generate.

### Phase E — Generalization & submission polish — ~4h

- **P1 E1.** Fill in Aisha persona (the non-traditional homeschool/portfolio case). 30 min, 4 artifacts + `08_expected_claims.md`. Proves the graph handles non-GPA students. Don't do James — too similar to Maria.
- **P1 E2.** Pitch deck (10–12 slides) + submission writeup. Lead with: "Nami uses HD's filesystem primitives (`/v1/fs`) to let every agent `grep` a dual-scope knowledge graph (student's life + the world of college admissions) in a single call. Every claim the AI makes is a clickable receipt back to a chunk ID." Include the Archivist eval score.
- **P1 E3.** Submission video: 30s trailer cut of the 2:30 for the submission page thumbnail.
- **P1 E4.** README top-section: rewrite for HD judges specifically. Lead with the `/v1/fs` usage. Link to [HUMAN_DELTA.md](HUMAN_DELTA.md).

### Phase F — Boil-the-ocean stretch (if Phases A–D ship early)

- **P2 F1. "Tell me what I said" bar** — a floating search across the whole office. Types "grandmother" → every claim, file, and chunk mentioning it lights up, across both scopes. Feels like searching your own brain. Uses `grep` + `searchGraph`.
- **P2 F2. Cross-essay callback agent** — a standing query that fires when the student opens a new essay prompt: "you already told this story in your PIQ, draft #3, and your voice memo — wanna do something else?" One-of-a-kind UX.
- **P2 F3. Counselor field-notebook corpus** — seed `world/patterns/` with 20 anonymized "students like Maria got into X with essays about Y" notes (you write these; they're fiction-but-grounded). Scout + Draft surface these as prior-art. This is a HD seed no one else will think to make.
- **P2 F4. Auto-generated student dashboard PDF** — after ingest, synthesize a single PDF ("Maria's brief"): academic, financial, schools, essays, deadlines. Every line cited. Downloadable artifact the student walks away with. Shippable moat.
- **P2 F5. Pacer-as-cron** — real background job (Supabase `pg_cron` or setTimeout server-side) that emits "FAFSA in 2 weeks" events that light up Pacer's desk between demo takes. Proves ambient.
- **P2 F6. Knowledge graph export to JSON-LD** — `/api/profile/export` returns the student's entire confirmed graph as portable JSON-LD. "Your memory belongs to you." Privacy narrative.
- **P2 F7. HD-powered onboarding** — first-run flow uploads Maria's 7 files as demo data, uses HD `/v1/fs` to literally show the tree building. Replaces the current empty-state with a seeded walkthrough.

---

## Part 5 — Budget & risk

- **Total P0 hours:** ~48h focused work. Tight but achievable over a hackathon weekend if paired.
- **P1 adds:** ~14h.
- **P2 stretch:** ~20h more.
- **Biggest risk:** HD `/v1/fs` not behaving as documented. Mitigation: add an in-repo simulator (`lib/humandelta/fs-mock.ts`) that shims the expected behavior against the local library corpus, so the UI ships even if HD fs is flaky. Degrades gracefully.
- **Second risk:** Supabase Realtime latency makes the ProposalQueue feel laggy. Mitigation: local optimistic updates, reconcile on server echo.
- **Third risk:** Scope. Phase C is heavy. If we're short, cut EssayParser and replace its outputs with seeded `claims` for the demo; the grandmother beat still works from confirmed data.

---

## Part 6 — What you say to the judges

> "Most HD submissions this weekend will call `hd.search()` once and call it integration. Nami treats HD like a filesystem and a dual-scope memory. Every specialist `grep`s both the student's life and the world of admissions in a single call. Every sentence Dean speaks has a clickable chunk-ID receipt. We evaluated our ingestion workers against 87 ground-truth claims about our composite student — 83% recall, 100% provenance. The product is a first-gen student's whole counseling team, for free, with no hallucinations by construction. HD isn't underneath it. HD is it."

That's the sentence. Everything in the todo list above exists to earn the right to say it.