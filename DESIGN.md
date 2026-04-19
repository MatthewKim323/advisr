# DESIGN.md — Nami

**Project:** Nami — college counseling crew (seven-agent submarine metaphor)
**Tokens extracted from:** `~/.gstack/projects/MatthewKim323-advisr/designs/landing-critique-20260419/finalized.html`
**Source reference:** `frontend/src/App.tsx` (Leo's draft), tightened per /design-html critique 2026-04-19
**Status:** v1 — landing page only. Extend as new surfaces land.

---

## 1. Aesthetic

Deep-ocean submarine. Nautical without being cute. The student is piloting a submarine through dark water with a crew of seven specialists. The interface should feel like a bridge console at night — mostly black, instruments glowing, nothing shouting.

- **Tone:** serious, competent, quiet. Not playful. Not corporate.
- **Reference posture:** bathymetric charts, radar CRTs, old NOAA vessel logs.
- **Editorial voice:** italic serif display on display type signals human authorship; all-caps monospace on technical labels signals system output. The tension between the two is the visual grammar of the product.

---

## 2. Color

All colors as CSS custom properties. Palette is intentionally narrow — ink for surface, paper for type, emerald as the only signal color, terracotta reserved for alert states. No purple. No blue gradients. No decorative color.

```css
:root {
  /* surface */
  --ink:         #080E1A;   /* primary surface — near-black, slight blue bias */
  --ink-2:       #0B1321;   /* secondary surface, nav elevated state */

  /* type on dark */
  --paper:       #FFFFFF;
  --ghost-90:    rgba(255,255,255,0.90);
  --ghost-80:    rgba(255,255,255,0.80);   /* hero sub */
  --ghost-60:    rgba(255,255,255,0.60);   /* body copy */
  --ghost-40:    rgba(255,255,255,0.40);   /* muted copy, pre-hover state */

  /* structure */
  --line:        rgba(255,255,255,0.10);   /* hairlines, card borders */
  --line-strong: rgba(255,255,255,0.20);   /* button borders, emphasized dividers */

  /* signal */
  --signal:      #10B981;   /* emerald — "system ok", crew online, sonar ping */
  --alert:       #E8604C;   /* warm terracotta — only for error/alert, never decorative */
}
```

**Rules:**
- Never use a non-`--ghost-*` white. Opacity carries hierarchy.
- `--signal` is reserved for active system states (agents online, sonar, signal strength). Do not use it for CTAs or links.
- `--alert` is reserved for `NO_MAP_DETECTED`-class error states. Never pure red (`#EF4444`).
- Backgrounds are always `--ink` or `rgba(255,255,255,0.02)` for subtle section separation. No tinted section backgrounds.

---

## 3. Typography

Three families. Period. Do not add a fourth.

```css
:root {
  --f-display: "Newsreader",    "Source Serif Pro", Georgia, serif;
  --f-body:    "IBM Plex Sans",  system-ui, -apple-system, sans-serif;
  --f-mono:    "JetBrains Mono", "Courier New", monospace;
}
```

**Load via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### 3.1 Roles

| Family       | Role                                                                    | Weights used |
|--------------|-------------------------------------------------------------------------|--------------|
| Newsreader   | Display — hero, section H2s, crew names, mega type, final editorial     | 400, 500     |
| IBM Plex Sans| Body — all prose, buttons that aren't uppercase labels                  | 300, 400, 500 |
| JetBrains Mono| Technical — nav links, kickers, crew roles, system labels, CTAs       | 500, 700     |

### 3.2 Scale

```
Hero headline    clamp(56px, 9vw, 80px)   Newsreader 400, leading 0.88, tracking -0.045em
Mega ("From lost to landed")  clamp(88px, 14vw, 180px)  Newsreader 400, leading 0.78, tracking -0.055em
Section H2       clamp(40px, 5vw, 56px)   Newsreader 400, leading 0.92, tracking -0.03em
Crew name        32px (wide card: 40px)   Newsreader 400, tracking -0.04em
Arch H3          26px italic              Newsreader 500 italic, tracking -0.02em
Hero sub         15px                     IBM Plex Sans 300, leading 1.55
Body             14px                     IBM Plex Sans 400, leading 1.65–1.70, color --ghost-60
Step title       17px                     IBM Plex Sans 500, tracking -0.015em
Kicker / label   10px uppercase           JetBrains Mono 700, tracking 0.22em–0.32em
Nav link         11px uppercase           JetBrains Mono 700, tracking 0.22em
Button label     11–13px uppercase        JetBrains Mono 700, tracking 0.18em–0.22em
```

**Rules:**
- Italics are for Newsreader only, and only on section headings / mega type. Body italics are forbidden (too much visual noise).
- Uppercase is only for mono. Never uppercase body sans.
- Letter-spacing is tight on display (negative values), wide on mono (0.18em+). The contrast is the system.

---

## 4. Spacing — 8pt grid

```css
:root {
  --s-1: 8px;    --s-2: 16px;   --s-3: 24px;   --s-4: 32px;
  --s-6: 48px;   --s-8: 64px;   --s-12: 96px;  --s-16: 128px;  --s-24: 192px;
}
```

### 4.1 Vertical rhythm between sections

| From → To                    | Spacing        |
|------------------------------|----------------|
| Hero → Gap                   | 128px (--s-16) |
| Gap → Crew                   | 128px (--s-16) |
| Crew → Log                   | 192px (--s-24) |
| Log → Arch                   | 192px (--s-24) |
| Arch → Final CTA             | 128px (--s-16) |
| Final CTA → Footer           | 96px  (--s-12) |

### 4.2 Container widths

```css
.container       { max-width: 1024px; padding: 0 64px; }
.container-wide  { max-width: 1800px; padding: 0 48px; }
```

Content reads inside `.container` (1024px). Structural chrome (nav, hero, partners bar) uses `.container-wide` (1800px).

---

## 5. Borders & Radii

- Hairlines: `1px solid var(--line)` — card edges, hairline dividers
- Strong borders: `1px solid var(--line-strong)` — buttons, emphasized edges
- Radii are binary:
  - `0` — cards, panels, split cells (hard edges, bridge-console feel)
  - `999px` — pills (nav, buttons) and circular chips only

No in-between radii. No `border-radius: 8px`. Never.

---

## 6. Shadow & Depth

Only the scrolled nav pill carries a shadow:
```css
.nav.is-scrolled { box-shadow: 0 20px 40px rgba(0,0,0,0.30); }
```

Everything else uses opacity + hairlines for depth. No drop shadows on cards. The loader uses `box-shadow: 0 0 24px rgba(16,185,129,0.6)` for the sonar core glow — reserved for that one element.

---

## 7. Glass surfaces

Two tiers of liquid glass, both ≥ 20px blur so they read on dark:

```css
.liquid-glass        { background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); border: 1px solid var(--line-strong); border-radius: 999px; }
.liquid-glass-strong { background: rgba(255,255,255,0.15); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.20); border-radius: 999px; }
```

Use cases:
- `.liquid-glass` — nav (scrolled), primary buttons on dark imagery
- `.liquid-glass-strong` — final CTA only (the "submit" moment)

---

## 8. Motion

### 8.1 Easing
```css
:root { --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1); }
```
One easing curve across the system. Do not add a second.

### 8.2 Durations
- Micro (hover, button state): `220ms`
- Nav state (morph on scroll): `320ms`
- Reveals (`blur-up`, intersection-triggered): `800ms`
- Loader sonar sweep: `2.4–2.5s` (ambient, not triggered)

### 8.3 Reveals

```css
.reveal     { opacity: 0; transform: translateY(14px); filter: blur(6px); transition: all 0.8s var(--ease-out); }
.reveal.is-in { opacity: 1; transform: translateY(0);   filter: blur(0); }
```
Toggle via `IntersectionObserver` with `rootMargin: -80px 0px`.

### 8.4 Hero text stagger

Per-token `animation-delay` via `--delay` custom property. Delays step by 0.10s per word. Never sync all words at once — staggered is the whole point.

### 8.5 `prefers-reduced-motion`

Respected globally. All animations collapse to `0.01ms`. Loader rings stop. Scroll behavior becomes `auto`.

---

## 9. Layout behavior (Pretext)

Display-type elements (`[data-pretext]`) get resize-aware height computation via Pretext's `prepare()` + `layout()`. Run after `document.fonts.ready`. Re-layout on `ResizeObserver`.

- Scope: hero headline, section H2s, log mega, any editorial headline
- Scope NOT: body paragraphs (CSS line-wrapping is fine), labels, buttons
- Fallback: if Pretext fails on a node, CSS line-wrapping takes over. Never block render on layout.

---

## 10. Iconography

- Icons inherit `currentColor`.
- Muted default (`rgba(255,255,255,0.22)`), brighter on hover (`rgba(255,255,255,0.45)`).
- Stroke width: `1.5`.
- Size: `28px` (crew cards), `40px` (wide card).
- SVG inline. No icon fonts. No lucide-react import for vanilla contexts.

---

## 11. Content-data surfaces

When rendering system state (agent status, gap cells, sonar labels), use the structured pattern:

```html
<span class="gap-cell-label">What the process assumes you have</span>
<ul>
  <li>Someone who has navigated this before</li>
</ul>
<div class="gap-signal ok">
  <span class="dot"></span>
  <span>STABLE_SIGNAL</span>
</div>
```

- Label above in mono uppercase at 9–10px
- Content in body sans
- System status below in mono at 9px with a colored dot
- Error dots pulse (`animation: pulse 1.6s`), OK dots are static

---

## 12. Breakpoints

```
375px   — mobile baseline (iPhone SE)
768px   — tablet, nav hides links
900px   — gap/arch sections collapse grid to 1 column
1024px  — content container reaches max
1440px  — desktop baseline
1800px  — chrome container reaches max
```

No 1920+ tier. If someone has an ultrawide, they get centered chrome.

---

## 13. Forbidden patterns (AI slop blacklist)

- Purple/violet/indigo — not in the palette, do not introduce
- Blue-to-purple gradients as backgrounds
- Center-everything hero with left-text + right-stock-image
- Three-column generic feature grids
- `border-radius: 12px` rounded-corner cards with drop shadows
- Emoji as UI elements (🚀, 🎯, ✨)
- `picsum.photos` or any stock image — use SVG/CSS-drawn assets in the nautical metaphor
- "Get Started" / "Learn More" — always in-character ("Pilot Your Submarine", "Your Crew Is Ready", "Begin Dive", "Meet the Crew")
- Inter / Roboto / Arial — use the three declared families only
- Mixing icon sets — stick to hand-tuned inline SVG in the 1.5-stroke house style

---

## 14. Open questions for future design surfaces

- Forms: no form design exists yet. When we build the intake flow, forms need their own token section (field states, error states, focus rings on dark).
- Data dashboards: the `/office` surface and agent workbench don't yet align with these tokens. Reconcile on next pass.
- Pixel art / aged paper aesthetic from `~/.gstack/projects/MatthewKim323-advisr/matthewkim-main-design-20260419-140044.md` (after-hours counseling office) is **not** reconciled with the submarine metaphor. Open strategic question — resolve before building a second major surface.
