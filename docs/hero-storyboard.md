# Hero Storyboard — Tell Me What I Said

The 90-second rough cut. Every frame annotated. Every engineering decision downstream either serves this or gets cut.

Hero duration target: 45s (0:45 → 1:30 in the 2:30 video).

---

## Frame 1 — Office at rest (0:00 → 0:03)

**Canvas state.** After-hours counseling office, warm amber desk lamps, aged paper texture on the walls. Six specialist desks. Dean's desk upstage-center. Four Tier-1 agents (Archivist, Draft, Scout, Match-Maker) idle at their desks, soft breathing animation (1 bob every 2s, ±1px). Tier-2 agents (Bursar, Pacer) static idle sprites, no bob.

**Search bar.** "Tell me what I said" bar top-center of canvas, 560px clamp, empty, JetBrains Mono 16px, amber caret pulsing at 1Hz.

**Chat panel.** Right side, one Dean message visible: "Maria's library is ingested. 47 claims confirmed. What do you want to look at?"

**Constellation.** Not visible yet (behind the canvas, faded to 0% opacity).

**Audio.** Soft ambient room tone. No music yet.

---

## Frame 2 — User types `grandmother` (0:03 → 0:11)

**Trigger.** Keystroke "g-r-a-n-d-m-o-t-h-e-r" at ~0.8s, debounce fires at 0:04.15.

**What lights up (simultaneous, 180ms ease-in, staggered 40ms):**

| Surface | State change | Visual |
|---|---|---|
| `draft.desk` (essay drafts) | `sourceKind: "essay"` hits = 6 | Essay paper on desk glows amber, grandmother lines highlight in warmer amber |
| `archivist.desk` (transcripts shelf) | `sourceKind: "transcript"` hits = 1 | One folder on shelf dim-pulses briefly |
| `archivist` sprite | idle → walking-to-cabinet → at-desk | Walk cycle 6 frames, 480ms total |
| `constellation` overlay | fade in to 40% opacity | Grandmother node pulses, edges to "identity" and "family" entities glow |
| `draft` sprite | idle → essay-highlight | Desk lamp intensity +30%, paper glow halo |
| `bursar.desk`, `pacer.desk` | idle → dimmed | Desk lamps to 40% opacity, sprites hold |

**Chat panel.** No Dean message yet. Chat stays quiet during the reveal.

**Audio.** Single soft "page turn" foley on `draft.desk` glow. Nothing else.

**This frame IS the product thesis.** Density on one desk, void on another, all from one keystroke.

---

## Frame 3 — User types `robotics` (0:11 → 0:21)

**Trigger.** Prior query fades back to neutral over 200ms (don't leave stale lighting). User clears bar (backspace or cmd-A delete), types "r-o-b-o-t-i-c-s", debounce fires.

**What lights up:**

| Surface | State change | Visual |
|---|---|---|
| `archivist.desk` (transcripts shelf) | `sourceKind: "transcript"` hits = 14 | Transcripts shelf lights HARD, multiple folders glow |
| `draft.desk` (essay drafts) | `sourceKind: "essay"` hits = 0 | Essay paper stays dim, NO glow — the void |
| `archivist` sprite | idle → walking-to-cabinet | Walk cycle |
| `activity.log` desk affordance (if present) | dense | Robotics team entries highlight |
| `constellation` | robotics-identity node pulses, edges to Harvey Mudd, to scholarships |
| `scout` sprite | idle → scholarship-match | Desk lamp pulses, scholarship cards flicker |
| `match-maker` sprite | idle → college-match | Harvey Mudd card lights up |
| `draft` sprite | idle → dimmed | Desk lamp to 40%, paper stays dim |

**Chat panel.** Still quiet. The UI contrast is doing the work.

---

## Frame 4 — The contrast frame (0:21 → 0:28)

**Canvas freeze** for 2 beats. Both prior query states held simultaneously via a side-by-side composite in post-edit: grandmother state (left third, dimmed/captioned "what you wrote") + robotics state (right third, bright/captioned "what you told me"). This composite is an **editing-room overlay** for the video, NOT a code feature. In the live demo, the latest query state (robotics) holds on screen.

**Annotations (overlay text in the video only, not in UI):**

- Left: "6 essay hits. 1 transcript hit."
- Right: "0 essay hits. 14 transcript hits."
- Center: "She never wrote about it."

**Audio.** Quiet. Let the contrast land.

---

## Frame 5 — Dean's close line (0:28 → 0:38)

**Canvas state.** Robotics state holds. No new query.

**Chat panel.** Dean types (typewriter reveal, 55 chars/sec):

> You wrote the page about your grandmother. You told me about robotics. Want to write what's actually yours?

**Trigger condition.** This line fires when the hero-controller detects:
- Query 1 hit distribution: essay-heavy (essay hits > transcript hits, essay hits ≥ 3)
- Query 2 hit distribution: transcript-heavy (transcript hits > essay hits × 5, transcript hits ≥ 10)
- Within a 15-second window on the same session

The threshold ensures the line never fires on a query pair where the contrast isn't real. Safety rail: the line is **scripted and gated**, not free-form LLM. We never risk Dean saying the wrong close at the wrong moment.

**Audio.** Soft piano chord under Dean's final word. Builds subtle emotional beat.

---

## Frame 6 — Hold + transition (0:38 → 0:45)

**Canvas state.** Constellation fades to 80% opacity, pulls focus. Robotics subgraph (Maria node → "robotics-identity" → Harvey Mudd → MakerGirl scholarship) visible and pulsing at 0.5Hz.

**Affordance hint.** A subtle "[Download Maria's student brief]" button pulses in the office HUD bottom-right. Primary CTA for the F4 beat that follows.

**Audio.** Room tone returns. Piano fades.

**Transition out.** Cut to dual-scope Match-Maker secondary beat (1:30 in the video).

---

## Triggering contract (hero-controller)

```ts
type HeroState =
  | { phase: "idle" }
  | { phase: "awaiting-second-query"; firstQuery: QuerySnapshot }
  | { phase: "close-fired"; firstQuery: QuerySnapshot; secondQuery: QuerySnapshot };

// Fires after query 2 commits and matches the contrast pattern.
function shouldFireClose(q1: QuerySnapshot, q2: QuerySnapshot): boolean {
  const essayHeavy =
    q1.hitsBySourceKind.essay >= 3 &&
    q1.hitsBySourceKind.essay > q1.hitsBySourceKind.transcript;
  const transcriptHeavy =
    q2.hitsBySourceKind.transcript >= 10 &&
    q2.hitsBySourceKind.transcript > q2.hitsBySourceKind.essay * 5;
  return essayHeavy && transcriptHeavy;
}
```

The close line is one of three scripted options keyed to which themes came up. For Maria's canonical demo pair (`grandmother`, `robotics`) the line is the one in Frame 5. If the demo ends up on a different theme pair (e.g. `mom`, `cello`), the controller picks from `HERO_CLOSE_LINES[themePair]`. Fallback: generic "You wrote one thing. You told me another. Let's write the second one."

---

## What this storyboard pins

1. **F1 must dispatch within 150ms of keystroke commit.** Non-negotiable; the `draft.desk` glow has to feel caused-by-typing, not caused-by-waiting.
2. **Sprite walk cycles need ≥6 frames on Archivist.** Verify `/Office Tileset/` has these; otherwise budget 1–2h to extract.
3. **Source-to-UI binding layer must handle 5 sourceKinds at minimum** (essay, transcript, financial, activity, scholarship). See design doc for the full enum.
4. **Chat must NOT fire during frames 2–3.** The UI contrast IS the reveal. Dean speaks in frame 5 only.
5. **Close line is scripted and gated, not generated.** Zero risk of hallucination at the hero moment.
6. **Constellation overlay starts at 0% opacity.** It enters during frame 2 fade-in. Don't show an idle graph — make it feel summoned by the query.
7. **Tier-2 agents dim but never animate.** That's the 8–10h savings called out in the design.

Everything downstream now has a concrete target to build against.
