"use client";

/**
 * PixelWorld — tile-rendered submarine office, shaped like an actual sub.
 *
 * Architecture (bottom-to-top):
 *   0. Canvas bg: transparent — parent is blank, awaits ocean shader.
 *   1. Hull clip: capsule / stadium shape (rounded bow + stern).
 *   2. Procedural deck-plate floor — solid base + seams + rivets.
 *      Zero sprite dependency, so there are no transparency holes.
 *   3. Furniture — Donarg tiles stamped at integer tile coords.
 *   4. Characters — Kenney sprites, 2-frame idle-breath cycle.
 *   5. Procedural porthole (bow cap) + file hatch (mid-deck floor).
 *   6. Nameplates — brass plates drawn directly on canvas.
 *   7. Hull stroke: steel-grey + brass trim + perimeter rivets.
 *   8. TileAtlas dev overlay — `~` toggles.
 *
 * Nothing outside the hull is painted → the ocean shader can live in
 * CSS behind the canvas and show through cleanly.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CharacterId } from "@/components/office/state-machine";
import {
  AGENT_TAGLINE,
  IDLE_TASK,
} from "@/lib/agent-state/task-labels";
import {
  useAgentStates,
  useAgentStatesRef,
  type AgentStates,
  type LiveStatus,
} from "@/lib/agent-state/store";
import {
  CHARS,
  OFFICE,
  RENDER_SCALE,
  SHEET_CHARS,
  SHEET_OFFICE,
  TILE,
  Tile,
  charFrame,
  type Facing,
} from "./assets";
import {
  DECOR,
  GRID_H,
  GRID_W,
  HULL_R,
  HATCH_RECT,
  PORTHOLE_RECT,
  STATIONS,
  type StationSpec,
} from "./map";

/** Per-frame override derived from the live event stream. Drives everything
 *  from "should the monitor be lit" to "should we render a thought bubble". */
type LiveOverride = {
  status: LiveStatus;
  task?: string;
  message?: string;
  /** True when the agent is actively engaged with a tool. Forces the sprite
   *  to render at the chair regardless of the static `activity` field. */
  isLive: boolean;
};

function liveFor(id: CharacterId, states: AgentStates): LiveOverride {
  const s = states[id];
  return {
    status: s?.status ?? "idle",
    task: s?.task,
    message: s?.message,
    isLive: s?.status === "working" || s?.status === "thinking",
  };
}

type Sheet = { image: HTMLImageElement; ready: boolean };

/* Pixel dimensions (unscaled, then we scale the context). */
const W_PX = GRID_W * TILE;
const H_PX = GRID_H * TILE;

/* Outer padding so the hull never flush-edges the canvas — gives the
 * stroke and rivets some breathing room and keeps the exterior blank. */
const PAD = 12;

/* ──────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────── */

export default function PixelWorld() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showAtlas, setShowAtlas] = useState(false);

  // Live agent state: drives thought bubbles, LED colors, screen lighting.
  // We hold TWO subscriptions — the ref for the canvas loop (read every
  // frame, avoids extra renders) and the hook for the DOM hover overlays.
  const liveRef = useAgentStatesRef();
  const liveStates = useAgentStates();

  const sheets = useRef<{ office: Sheet | null; chars: Sheet | null }>({
    office: null,
    chars:  null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    (async () => {
      const [o, c] = await Promise.all([load(SHEET_OFFICE), load(SHEET_CHARS)]);
      if (cancelled) return;
      sheets.current.office = { image: o, ready: true };
      sheets.current.chars  = { image: c, ready: true };
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "~") setShowAtlas((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const tick = (now: number) => {
      render(ctx, now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = (ctx: CanvasRenderingContext2D, now: number) => {
    const { office, chars } = sheets.current;
    const states = liveRef.current ?? ({} as AgentStates);

    ctx.imageSmoothingEnabled = false;

    // Clear entire canvas — exterior stays transparent for the bg layer
    ctx.clearRect(
      0, 0,
      (W_PX + PAD * 2) * RENDER_SCALE,
      (H_PX + PAD * 2) * RENDER_SCALE,
    );

    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    ctx.translate(PAD, PAD);

    // ── Clipped pass: everything that should stay inside the hull
    ctx.save();
    hullPath(ctx);
    ctx.clip();

    drawDeckFloor(ctx);
    drawHullInteriorWash(ctx);

    // Per-station bunks sit behind the chair/char
    drawBunks(ctx);

    // Procedural workstation = desk + chair + (monitor|laptop). No sprite
    // tiles involved for these, which avoids the tile-index guesswork that
    // made the desks render as bookshelves.
    drawStationWorkstations(ctx, states);
    drawLaptopGlow(ctx, states, now);

    // Sprite-based decor (plants, bookshelves, boxes) still uses Donarg
    if (office?.ready) drawFurniture(ctx, office.image);

    if (chars?.ready) drawCharacters(ctx, chars.image, now, states);

    drawHatchCutout(ctx);
    drawPortholeCutout(ctx);
    drawStationNameplates(ctx);
    drawActivityIndicators(ctx, now, states);
    drawThoughtBubbles(ctx, now, states);

    ctx.restore();

    // ── Unclipped: hull chrome + rivets + hull placard
    drawHullOutline(ctx);
    drawHullPlacard(ctx);

    ctx.restore();
  };

  const canvasW = (W_PX + PAD * 2) * RENDER_SCALE;
  const canvasH = (H_PX + PAD * 2) * RENDER_SCALE;

  /* Responsive scaling: the canvas keeps its native pixel-perfect buffer
   * (no loss of detail), and CSS stretches it to fit the parent container
   * while preserving aspect ratio. `image-rendering: pixelated` keeps the
   * downscale crisp (nearest-neighbor) so edges stay sharp. */
  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth:    canvasW,
        aspectRatio: `${canvasW} / ${canvasH}`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        className="block h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <StationHotspots states={liveStates} />
      {showAtlas && <TileAtlas />}
      <DevHint />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Interactive hotspots — overlay absolute <Link>s on top of each
   interactable station. Positioned in percent space relative to
   the canvas wrapper, which keeps the same aspect ratio as the
   pixel buffer, so percentages map cleanly back to tile coords.
   ────────────────────────────────────────────────────────────── */

/** Interactable stations and where they route to. Only a subset of stations
 *  have a destination today — the rest are inert for now. */
const STATION_LINKS: Partial<Record<StationSpec["id"], { href: string; label: string }>> = {
  archivist: { href: "/archivist", label: "ENTER RECORDS ROOM" },
};

/** Compute a station's bounding rect (covers bunk+desk) in percent of wrapper. */
function stationRectPct(s: StationSpec) {
  const fullW = GRID_W * TILE + PAD * 2;
  const fullH = GRID_H * TILE + PAD * 2;
  const minX = Math.min(s.bunk.x, s.desk.x, s.chair.x) * TILE + PAD;
  const maxX =
    Math.max(
      s.bunk.x + s.bunk.w,
      s.desk.x + s.desk.w,
      s.chair.x + 1,
    ) * TILE + PAD;
  const minY = Math.min(s.bunk.y, s.desk.y, s.chair.y) * TILE + PAD;
  const maxY =
    Math.max(
      s.bunk.y + s.bunk.h,
      s.desk.y + s.desk.h,
      s.chair.y + 1,
    ) * TILE + PAD;
  return {
    left: (minX / fullW) * 100,
    top: (minY / fullH) * 100,
    width: ((maxX - minX) / fullW) * 100,
    height: ((maxY - minY) / fullH) * 100,
  };
}

/** Hover overlays for every station. Each shows a themed thought-bubble
 *  tooltip with the agent's current task. Stations with a `STATION_LINKS`
 *  entry also act as a <Link>; the others are divs with the same visuals. */
function StationHotspots({ states }: { states: AgentStates }) {
  return (
    <>
      {STATIONS.map((s) => {
        const link = STATION_LINKS[s.id];
        const r = stationRectPct(s);
        const live = states[s.id as CharacterId];
        const status = live?.status ?? "idle";
        const task =
          status === "error"
            ? live?.message ?? "blocked"
            : live?.task ?? IDLE_TASK[s.id as CharacterId];
        const tagline = AGENT_TAGLINE[s.id as CharacterId];
        const style: React.CSSProperties = {
          left: `${r.left}%`,
          top: `${r.top}%`,
          width: `${r.width}%`,
          height: `${r.height}%`,
        };
        // Accent color per agent = blanket. Used for the bubble stroke,
        // which gives each tooltip a touch of personal identity.
        const accent = s.blanket;

        const body = (
          <>
            <HoverReticle />
            <ThoughtTooltip
              name={s.label}
              tagline={tagline}
              status={status}
              task={task}
              accent={accent}
              actionLabel={link?.label}
            />
          </>
        );

        if (link) {
          return (
            <Link
              key={s.id}
              href={link.href}
              aria-label={`${s.label} — ${link.label}`}
              className="group absolute z-10"
              style={style}
            >
              {body}
            </Link>
          );
        }
        return (
          <div
            key={s.id}
            className="group absolute z-10"
            aria-label={`${s.label} — ${tagline}`}
            style={style}
          >
            {body}
          </div>
        );
      })}
    </>
  );
}

/** Corner bracket + glow that appears on hover — same as before, extracted. */
function HoverReticle() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      style={{
        boxShadow:
          "0 0 0 1px rgba(124,255,147,0.55), 0 0 22px rgba(124,255,147,0.3), inset 0 0 0 1px rgba(10,26,38,0.8)",
      }}
    >
      <span
        className="absolute left-0 top-0 h-2 w-2"
        style={{ borderTop: "1px solid var(--sonar)", borderLeft: "1px solid var(--sonar)" }}
      />
      <span
        className="absolute right-0 top-0 h-2 w-2"
        style={{ borderTop: "1px solid var(--sonar)", borderRight: "1px solid var(--sonar)" }}
      />
      <span
        className="absolute bottom-0 left-0 h-2 w-2"
        style={{ borderBottom: "1px solid var(--sonar)", borderLeft: "1px solid var(--sonar)" }}
      />
      <span
        className="absolute bottom-0 right-0 h-2 w-2"
        style={{ borderBottom: "1px solid var(--sonar)", borderRight: "1px solid var(--sonar)" }}
      />
    </span>
  );
}

/** Pixel-themed thought bubble that floats above a station on hover. */
function ThoughtTooltip({
  name,
  tagline,
  status,
  task,
  accent,
  actionLabel,
}: {
  name: string;
  tagline: string;
  status: LiveStatus;
  task?: string;
  accent: string;
  actionLabel?: string;
}) {
  // Color the status pip by state. Green = working, amber = thinking,
  // red = blocked, grey = idle.
  const pipColor =
    status === "working"
      ? "#7cff93"
      : status === "thinking"
        ? "#e6a559"
        : status === "error"
          ? "#ff6a6a"
          : "#6f8fa3";
  const statusLabel =
    status === "working"
      ? "WORKING"
      : status === "thinking"
        ? "THINKING"
        : status === "error"
          ? "BLOCKED"
          : "IDLE";

  return (
    <span
      aria-hidden
      className="pixel-text pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:-translate-y-[calc(100%+12px)] group-focus-visible:opacity-100"
      style={{
        fontSize: 9,
        letterSpacing: "0.14em",
        color: "#e8f1ea",
        padding: "6px 9px 5px",
        background:
          "linear-gradient(180deg, rgba(12,34,52,0.96) 0%, rgba(6,20,32,0.96) 100%)",
        boxShadow: `0 0 0 1px ${accent}, 0 0 0 2px rgba(10,26,38,0.9), 0 8px 18px rgba(0,0,0,0.55)`,
        minWidth: 140,
      }}
    >
      {/* Top row: name + status pip */}
      <span className="flex items-center justify-between gap-3" style={{ marginBottom: 2 }}>
        <span style={{ color: accent }}>{name.toUpperCase()}</span>
        <span className="flex items-center gap-1">
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              background: pipColor,
              boxShadow:
                status === "idle" ? undefined : `0 0 6px ${pipColor}`,
              animation:
                status === "working" ? "bubble-pip 0.9s steps(2) infinite" : undefined,
            }}
          />
          <span style={{ color: pipColor, fontSize: 8 }}>{statusLabel}</span>
        </span>
      </span>
      {/* Tagline / role line (dim) */}
      <span className="block" style={{ color: "#6f8fa3", fontSize: 8, letterSpacing: "0.18em" }}>
        {tagline.toUpperCase()}
      </span>
      {/* Current task line */}
      {task && (
        <span
          className="block"
          style={{
            marginTop: 3,
            color: status === "working" ? "#7cff93" : "#cfe3df",
            fontSize: 9,
            letterSpacing: "0.08em",
            maxWidth: 260,
            whiteSpace: "normal",
            lineHeight: 1.25,
          }}
        >
          {"> "}
          {task}
        </span>
      )}
      {/* Action hint — only when the station is clickable */}
      {actionLabel && (
        <span
          className="block"
          style={{
            marginTop: 5,
            paddingTop: 4,
            borderTop: "1px solid rgba(212,154,74,0.4)",
            color: "#d49a4a",
            fontSize: 8,
            letterSpacing: "0.22em",
          }}
        >
          » {actionLabel}
        </span>
      )}
      {/* Bubble tail — two stacked squares simulating a comic thought bubble */}
      <span
        aria-hidden
        className="absolute"
        style={{
          left: "50%",
          bottom: -6,
          width: 4,
          height: 4,
          marginLeft: -2,
          background: "rgba(6,20,32,0.96)",
          boxShadow: `0 0 0 1px ${accent}`,
        }}
      />
      <span
        aria-hidden
        className="absolute"
        style={{
          left: "50%",
          bottom: -12,
          width: 2,
          height: 2,
          marginLeft: -1,
          background: "rgba(6,20,32,0.96)",
          boxShadow: `0 0 0 1px ${accent}`,
        }}
      />
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Hull geometry
   ────────────────────────────────────────────────────────────── */

/** Build the capsule (stadium) path in unscaled tile-pixel space. */
function hullPath(ctx: CanvasRenderingContext2D) {
  const R = HULL_R * TILE;
  ctx.beginPath();
  // Top edge
  ctx.moveTo(R, 0);
  ctx.lineTo(W_PX - R, 0);
  // Bow (right) semicircle
  ctx.arc(W_PX - R, H_PX / 2, R, -Math.PI / 2, Math.PI / 2);
  // Bottom edge
  ctx.lineTo(R, H_PX);
  // Stern (left) semicircle
  ctx.arc(R, H_PX / 2, R, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
}

/* ──────────────────────────────────────────────────────────────
   Deck — fully procedural, NO sprite tiles (that caused the holes).
   ────────────────────────────────────────────────────────────── */

function drawDeckFloor(ctx: CanvasRenderingContext2D) {
  // Base steel-blue
  ctx.fillStyle = "#243647";
  ctx.fillRect(-2, -2, W_PX + 4, H_PX + 4);

  // Seam grid — 1px dark lines every TILE px
  ctx.fillStyle = "#1a2836";
  for (let x = 0; x <= W_PX; x += TILE) {
    ctx.fillRect(x, 0, 1, H_PX);
  }
  for (let y = 0; y <= H_PX; y += TILE) {
    ctx.fillRect(0, y, W_PX, 1);
  }

  // Per-tile treatment — alternating dark/light plates
  for (let ty = 0; ty < GRID_H; ty++) {
    for (let tx = 0; tx < GRID_W; tx++) {
      const checker = (tx + ty) % 2 === 0;
      if (checker) {
        ctx.fillStyle = "rgba(0,0,0,0.10)";
        ctx.fillRect(tx * TILE + 1, ty * TILE + 1, TILE - 1, TILE - 1);
      }
      // Tiny rivet at the top-left corner of each plate
      ctx.fillStyle = "#3e5a73";
      ctx.fillRect(tx * TILE + 2, ty * TILE + 2, 1, 1);
      ctx.fillStyle = "#0d1822";
      ctx.fillRect(tx * TILE + 3, ty * TILE + 3, 1, 1);
    }
  }

  // Diagonal shimmer — ties the plates together, reads as metal sheen
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#6fb3cc";
  for (let i = 0; i < W_PX + H_PX; i += 12) {
    ctx.fillRect(i - H_PX, 0, 1, H_PX);
  }
  ctx.restore();
}

/** Subtle vignette along the inside of the hull curve — reads as interior
 * lighting falling off at the walls. */
function drawHullInteriorWash(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createRadialGradient(
    W_PX / 2, H_PX / 2, Math.min(W_PX, H_PX) * 0.25,
    W_PX / 2, H_PX / 2, Math.max(W_PX, H_PX) * 0.6,
  );
  grad.addColorStop(0,   "rgba(255,210,140,0.00)");
  grad.addColorStop(0.7, "rgba(120,80,30,0.10)");
  grad.addColorStop(1,   "rgba(5,12,20,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(-2, -2, W_PX + 4, H_PX + 4);
}

/* ──────────────────────────────────────────────────────────────
   Hull chrome
   ────────────────────────────────────────────────────────────── */

function drawHullOutline(ctx: CanvasRenderingContext2D) {
  // Outer shadow ring — gives the sub weight against the background
  ctx.save();
  hullPath(ctx);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.stroke();

  // Steel hull plating
  hullPath(ctx);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#5a7388";
  ctx.stroke();

  // Inner brass trim
  hullPath(ctx);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#b6813a";
  ctx.stroke();

  // Rivets around the perimeter
  drawPerimeterRivets(ctx);
  ctx.restore();
}

function drawPerimeterRivets(ctx: CanvasRenderingContext2D) {
  const R = HULL_R * TILE;
  const cyMid = H_PX / 2;
  const stepPx = 10; // rivet spacing in hull-local px

  // Top + bottom straight runs (between arcs)
  for (let x = R + stepPx / 2; x <= W_PX - R; x += stepPx) {
    rivet(ctx, x, 1);
    rivet(ctx, x, H_PX - 1);
  }
  // Stern arc
  arcRivets(ctx, R, cyMid, R, Math.PI / 2, (3 * Math.PI) / 2, stepPx);
  // Bow arc
  arcRivets(ctx, W_PX - R, cyMid, R, -Math.PI / 2, Math.PI / 2, stepPx);
}

function arcRivets(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  a0: number, a1: number, stepPx: number,
) {
  const arcLen = r * (a1 - a0);
  const count  = Math.max(4, Math.floor(arcLen / stepPx));
  for (let i = 0; i <= count; i++) {
    const a = a0 + ((a1 - a0) * i) / count;
    const x = cx + Math.cos(a) * (r - 1);
    const y = cy + Math.sin(a) * (r - 1);
    rivet(ctx, x, y);
  }
}

function rivet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#8ea8bd";
  ctx.fillRect(x - 1, y - 1, 2, 2);
  ctx.fillStyle = "#1b2d3d";
  ctx.fillRect(x, y, 1, 1);
}

/** Brass hull name placard centered at the bottom, riveted to the belly. */
function drawHullPlacard(ctx: CanvasRenderingContext2D) {
  const cx = W_PX / 2;
  const cy = H_PX + 2;
  const label = "BATHYSPHERE · VII";
  const w = label.length * 4 + 10;
  const h = 8;

  const g = ctx.createLinearGradient(0, cy, 0, cy + h);
  g.addColorStop(0, "#d49a4a");
  g.addColorStop(1, "#7a4e22");
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, cy, w, h);

  ctx.strokeStyle = "#0a1a26";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2 + 0.5, cy + 0.5, w - 1, h - 1);

  // rivets flanking
  rivet(ctx, cx - w / 2 + 2, cy + h / 2);
  rivet(ctx, cx + w / 2 - 2, cy + h / 2);

  ctx.fillStyle = "#0a1a26";
  ctx.font = '7px "Silkscreen", monospace';
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + 1);
}

/* ──────────────────────────────────────────────────────────────
   Furniture (sprite stamps from Donarg)
   ────────────────────────────────────────────────────────────── */

function stamp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tile: Tile,
  dx: number,
  dy: number,
) {
  const w = tile.w ?? 1;
  const h = tile.h ?? 1;
  ctx.drawImage(
    img,
    tile.col * TILE, tile.row * TILE,
    w * TILE, h * TILE,
    dx * TILE,  dy * TILE,
    w * TILE,   h * TILE,
  );
}

function drawFurniture(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  for (const obj of DECOR) stamp(ctx, img, obj.tile, obj.x, obj.y);
}

/* ──────────────────────────────────────────────────────────────
   Procedural workstations — desk + chair + screen drawn with canvas
   primitives. Zero sprite dependency.
   ────────────────────────────────────────────────────────────── */

function drawStationWorkstations(
  ctx: CanvasRenderingContext2D,
  states: AgentStates,
) {
  for (const s of STATIONS) {
    drawChair(ctx, s);
    drawDesk(ctx, s);
    drawScreen(ctx, s, liveFor(s.id as CharacterId, states));
  }
}

function drawChair(ctx: CanvasRenderingContext2D, s: StationSpec) {
  const px = s.chair.x * TILE;
  const py = s.chair.y * TILE;

  // Accent color per agent — use blanket color so the office reads coherently
  const accent = s.blanket;

  // Seat base (2-tile-wide chair looks proportioned even in 1 tile)
  const sx = px + 3;
  const sy = py + 5;
  const sw = TILE - 6;
  const sh = TILE - 8;

  // Wheel / floor mount
  ctx.fillStyle = "#1a2836";
  ctx.fillRect(px + TILE / 2 - 2, py + TILE - 3, 4, 2);

  // Stem
  ctx.fillStyle = "#3e5a73";
  ctx.fillRect(px + TILE / 2 - 1, py + TILE - 5, 2, 3);

  // Seat cushion
  ctx.fillStyle = shade(accent, -0.2);
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = accent;
  ctx.fillRect(sx, sy, sw, sh - 1);
  ctx.fillStyle = shade(accent, 0.35);
  ctx.fillRect(sx + 1, sy + 1, sw - 2, 1);

  // Backrest — on the FAR side of the chair from the desk.
  // For facing "down" the desk is below, so backrest is ABOVE the seat
  const backY = s.facing === "down" ? py + 1 : py + TILE - 4;
  const backH = 4;
  ctx.fillStyle = shade(accent, -0.35);
  ctx.fillRect(sx, backY, sw, backH);
  ctx.fillStyle = accent;
  ctx.fillRect(sx, backY + 1, sw, backH - 2);
  ctx.fillStyle = "#0a1a26";
  ctx.fillRect(sx, backY, 1, backH);
  ctx.fillRect(sx + sw - 1, backY, 1, backH);
}

function drawDesk(ctx: CanvasRenderingContext2D, s: StationSpec) {
  const px = s.desk.x * TILE;
  const py = s.desk.y * TILE;
  const pw = s.desk.w * TILE;
  const ph = s.desk.h * TILE;

  // Dark side/shadow
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(px, py, pw, ph);

  // Main wood top
  ctx.fillStyle = "#5e3e22";
  ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);

  // Upper edge highlight (where light hits the front lip of the desk)
  ctx.fillStyle = "#8a6338";
  ctx.fillRect(px + 1, py + 1, pw - 2, 2);

  // Bottom edge darker grain
  ctx.fillStyle = "#3a2616";
  ctx.fillRect(px + 1, py + ph - 3, pw - 2, 1);

  // Drawer seams — 1 vertical line every tile
  ctx.fillStyle = "#2e1d0d";
  for (let i = 1; i < s.desk.w; i++) {
    ctx.fillRect(px + i * TILE, py + 3, 1, ph - 6);
  }

  // Drawer handles (small brass dashes)
  ctx.fillStyle = "#d49a4a";
  for (let i = 0; i < s.desk.w; i++) {
    const hx = px + i * TILE + TILE / 2 - 2;
    const hy = py + ph - 5;
    ctx.fillRect(hx, hy, 4, 1);
  }

  // Dean's desk gets an extra brass trim band
  if (s.id === "dean") {
    ctx.fillStyle = "#d49a4a";
    ctx.fillRect(px + 2, py + 2, pw - 4, 1);
  }
}

/* Monitor or laptop sitting on the desk, oriented toward the char. */
function drawScreen(
  ctx: CanvasRenderingContext2D,
  s: StationSpec,
  live: LiveOverride,
) {
  const isLaptop = s.deskItem === OFFICE.laptop;
  const isDual   = s.deskItem === OFFICE.monitorDual;

  const centerX = (s.desk.x + s.desk.w / 2) * TILE;
  // Sit on the near edge of the desk (toward the character)
  const topY = s.desk.y * TILE + (s.facing === "down" ? 1 : s.desk.h * TILE - 9);

  // Light up the screen if the agent is statically working OR live-active.
  const isOn = s.activity === "working" || live.isLive;
  const isThinking = live.status === "thinking";
  const isError    = live.status === "error";

  // Per-state screen text color. The brighter amber in "thinking" reads as
  // the agent waiting on someone, the red stripe reads as an error screen.
  const glyphColor = isError
    ? "#ff6a6a"
    : isThinking
      ? "#e6a559"
      : "#7cff93";
  const scanColor = isError
    ? "rgba(255,106,106,0.22)"
    : isThinking
      ? "rgba(230,165,89,0.22)"
      : "rgba(124,255,147,0.25)";
  const bgColor = isError ? "#2a0a14" : isThinking ? "#2a1d0a" : "#0a2a2d";

  const drawOne = (cx: number, screenW: number, screenH: number) => {
    const x = cx - screenW / 2;
    const y = topY;

    // Bezel
    ctx.fillStyle = "#0a1418";
    ctx.fillRect(x, y, screenW, screenH);
    ctx.fillStyle = "#1a2836";
    ctx.fillRect(x + 1, y + 1, screenW - 2, screenH - 2);

    // Screen
    if (isOn) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x + 2, y + 2, screenW - 4, screenH - 4);
      ctx.fillStyle = glyphColor;
      ctx.fillRect(x + 3, y + 3, screenW - 6, 1);
      ctx.fillStyle = scanColor;
      for (let sy = y + 5; sy < y + screenH - 3; sy += 2) {
        ctx.fillRect(x + 3, sy, screenW - 6, 1);
      }
    } else {
      // Dim: screen mostly off, faint amber (sleeping / idle)
      ctx.fillStyle = "#0a1418";
      ctx.fillRect(x + 2, y + 2, screenW - 4, screenH - 4);
      ctx.fillStyle = "rgba(212,154,74,0.35)";
      ctx.fillRect(x + 3, y + 3, screenW - 6, 1);
    }

    // Stand — small pixel nub below the screen
    if (!isLaptop) {
      ctx.fillStyle = "#2c3e4f";
      ctx.fillRect(cx - 2, y + screenH, 4, 1);
      ctx.fillRect(cx - 3, y + screenH + 1, 6, 1);
    } else {
      // Laptop keyboard deck (sits in front of the raised screen)
      ctx.fillStyle = "#2c3e4f";
      ctx.fillRect(x, y + screenH, screenW, 2);
      ctx.fillStyle = "#1a2836";
      ctx.fillRect(x + 1, y + screenH + 1, screenW - 2, 1);
    }
  };

  if (isDual) {
    drawOne(centerX - 5, 9, 7);
    drawOne(centerX + 5, 9, 7);
  } else {
    drawOne(centerX, 11, 7);
  }
}

/* ──────────────────────────────────────────────────────────────
   Characters — always frame 0 (Kenney RPG Urban chars aren't stored
   as col-adjacent anim frames, so swapping frames caused the flicker).
   Breath is now a 1px vertical bob on the sprite's Y, swapped every
   480ms via tickRef.
   ────────────────────────────────────────────────────────────── */

function drawCharacters(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  now: number,
  states: AgentStates,
) {
  const breath = Math.floor(now / 480) % 2 === 0 ? 0 : -1;
  // Slightly faster, larger bob when an agent is actively working — feels
  // like they're actually hunched over the keyboard. Same amplitude but
  // different phase so the office doesn't breathe in unison.
  const workBob = Math.floor(now / 260) % 2 === 0 ? 0 : -1;

  for (const s of STATIONS) {
    if (s.activity === "away") continue;
    const live = liveFor(s.id as CharacterId, states);
    const c = CHARS[s.charKey];
    const f = charFrame(c, s.facing as Facing, 0);

    // If the agent is actively doing a tool call, force them onto the chair
    // regardless of static "sleeping" activity — otherwise Pacer/Scout (who
    // start in bunk state) would never be shown working.
    const atChair = s.activity === "working" || live.isLive;

    if (!atChair) {
      // Sleeping sprite centered on the bunk (no bob)
      const cx = (s.bunk.x + s.bunk.w / 2 - 0.5) * TILE;
      const cy = (s.bunk.y + s.bunk.h / 2 - 0.5) * TILE - 1;
      ctx.drawImage(
        img, f.col * TILE, f.row * TILE, TILE, TILE,
        cx, cy, TILE, TILE,
      );
      continue;
    }

    const bob = live.status === "working" ? workBob : breath;
    ctx.drawImage(
      img, f.col * TILE, f.row * TILE, TILE, TILE,
      s.chair.x * TILE,
      s.chair.y * TILE - 4 + bob,
      TILE, TILE,
    );
  }
}

/* ──────────────────────────────────────────────────────────────
   Procedural bunks — frame + mattress + pillow + per-agent blanket.
   Drawn before characters so a sleeping agent sits on top of the quilt.
   ────────────────────────────────────────────────────────────── */

function drawBunks(ctx: CanvasRenderingContext2D) {
  for (const s of STATIONS) drawBunk(ctx, s);
}

function drawBunk(ctx: CanvasRenderingContext2D, s: StationSpec) {
  const { x, y, w, h } = s.bunk;
  const px = x * TILE;
  const py = y * TILE;
  const pw = w * TILE;
  const ph = h * TILE;

  // Wooden frame (headboard/footboard)
  ctx.fillStyle = "#3a2616";
  ctx.fillRect(px, py, pw, ph);

  // Mattress
  ctx.fillStyle = "#f0e3c6";
  ctx.fillRect(px + 1, py + 2, pw - 2, ph - 3);

  // Blanket — covers the lower portion (the "foot" half, away from pillow)
  // For top-row staterooms (facing down) the pillow is at the top → blanket below.
  // For bottom-row (facing up) the pillow is at the bottom → blanket above.
  const pillowTop = s.facing === "down";
  const blanketY = pillowTop
    ? py + Math.floor(ph * 0.45)
    : py + 2;
  const blanketH = Math.floor(ph * 0.5);
  ctx.fillStyle = s.blanket;
  ctx.fillRect(px + 1, blanketY, pw - 2, blanketH);

  // Blanket fold stripe
  ctx.fillStyle = shade(s.blanket, -0.25);
  ctx.fillRect(px + 1, blanketY + (pillowTop ? 0 : blanketH - 1), pw - 2, 1);

  // Pillow
  const pillowH = 4;
  const pillowY = pillowTop ? py + 2 : py + ph - 2 - pillowH;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(px + 2, pillowY, pw - 4, pillowH);
  ctx.fillStyle = "#cfd4d9";
  ctx.fillRect(px + 2, pillowY + pillowH - 1, pw - 4, 1);

  // Dark outline frame
  ctx.strokeStyle = "#1a0e06";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

  // Corner posts (little bunk-rail feel)
  ctx.fillStyle = "#1a0e06";
  ctx.fillRect(px,        py,          2, 2);
  ctx.fillRect(px + pw-2, py,          2, 2);
  ctx.fillRect(px,        py + ph - 2, 2, 2);
  ctx.fillRect(px + pw-2, py + ph - 2, 2, 2);
}

/* Screen glow — bright when working, faint when sleeping. Anchors to the
 * near edge of the desk where the screen is drawn. When an agent is LIVE
 * (mid-tool-call), the glow breathes at ~1Hz for a "they're cooking" feel. */
function drawLaptopGlow(
  ctx: CanvasRenderingContext2D,
  states: AgentStates,
  now: number,
) {
  for (const s of STATIONS) {
    if (s.activity === "away") continue;
    const live = liveFor(s.id as CharacterId, states);
    const cx = (s.desk.x + s.desk.w / 2) * TILE;
    const cy = s.desk.y * TILE + (s.facing === "down" ? 4 : s.desk.h * TILE - 5);

    const baseIntensity = s.activity === "working" || live.isLive ? 1 : 0.25;
    // Breathing modulation when actively working — triangle wave, 1Hz.
    const pulse = live.status === "working"
      ? 0.65 + 0.35 * (Math.sin(now / 160) * 0.5 + 0.5)
      : 1;
    const intensity = baseIntensity * pulse;

    // Tint by state — green default, amber when thinking, red on block.
    const tint = live.status === "error"
      ? [255, 106, 106]
      : live.status === "thinking"
        ? [230, 165, 89]
        : [124, 255, 147];

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    g.addColorStop(0,   `rgba(${tint[0]},${tint[1]},${tint[2]},${0.50 * intensity})`);
    g.addColorStop(0.5, `rgba(80,200,230,${0.18 * intensity})`);
    g.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 16, cy - 16, 32, 32);
  }
}

/* Activity indicators — "Z" bubble over sleeping bunks, a tiny blinking
 * indicator light above a working laptop. Live status beats static activity:
 * a "sleeping" agent that receives a tool call is shown as busy. */
function drawActivityIndicators(
  ctx: CanvasRenderingContext2D,
  now: number,
  states: AgentStates,
) {
  for (const s of STATIONS) {
    const live = liveFor(s.id as CharacterId, states);
    const atChair = s.activity === "working" || live.isLive;

    if (!atChair) {
      drawZzz(ctx, s, now);
    } else {
      drawBusyLED(ctx, s, now, live.status);
    }
  }
}

function drawZzz(
  ctx: CanvasRenderingContext2D,
  s: StationSpec,
  now: number,
) {
  // Two Zs that bob on a 1.6s cycle — one large + one small, offset
  const t  = (now / 1600) % 1;
  const yo = Math.sin(t * Math.PI * 2) * 1;
  const cx = (s.bunk.x + s.bunk.w / 2) * TILE;
  const cy = (s.bunk.y - 0.5) * TILE + yo;

  ctx.save();
  ctx.font = '6px "Silkscreen", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillText("Z", cx + 1, cy + 1);
  ctx.fillText("z", cx + 4, cy + 4);

  // Zs
  ctx.fillStyle = "#a8c8dc";
  ctx.fillText("Z", cx, cy);
  ctx.fillStyle = "#6f8fa3";
  ctx.fillText("z", cx + 3, cy + 3);
  ctx.restore();
}

function drawBusyLED(
  ctx: CanvasRenderingContext2D,
  s: StationSpec,
  now: number,
  status: LiveStatus,
) {
  // LED placed on the top bezel of the monitor. Color + blink rate keyed
  // to the live status; idle still blinks softly so the office reads alive.
  const cx = (s.desk.x + s.desk.w / 2) * TILE;
  const cy = s.desk.y * TILE + (s.facing === "down" ? 2 : s.desk.h * TILE - 8);

  const period = status === "working" ? 220 : status === "thinking" ? 380 : status === "error" ? 140 : 700;
  const on = Math.floor(now / period) % 2 === 0;

  const onColor =
    status === "working"
      ? "#7cff93"
      : status === "thinking"
        ? "#e6a559"
        : status === "error"
          ? "#ff6a6a"
          : "#5a8a6a";
  const offColor =
    status === "error" ? "#40121c" : "#204030";

  ctx.fillStyle = on ? onColor : offColor;
  ctx.fillRect(cx - 1, cy, 2, 1);
}

/* ──────────────────────────────────────────────────────────────
   Thought bubbles — a tiny pixel cloud that floats above the
   agent's head when they're mid-tool-call. Three cycling dots
   inside to signal "processing". Idle / sleeping agents get no
   bubble (keeps the office quiet when nothing's happening).
   ────────────────────────────────────────────────────────────── */

function drawThoughtBubbles(
  ctx: CanvasRenderingContext2D,
  now: number,
  states: AgentStates,
) {
  for (const s of STATIONS) {
    const live = liveFor(s.id as CharacterId, states);
    if (!live.isLive) continue;
    // Anchor above the character's head. Because all stations face down,
    // the sprite sits at chair.y-ish and the head is a few px above that.
    const cx = s.chair.x * TILE + TILE / 2;
    const cy = s.chair.y * TILE - 8;

    // 1-px float bob, offset by station index so they don't all pulse in sync.
    const idx = STATIONS.indexOf(s);
    const bob = Math.sin(now / 320 + idx) * 1;
    drawThoughtBubble(ctx, cx, cy + bob, now + idx * 150, live.status);
  }
}

function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  now: number,
  status: LiveStatus,
) {
  // Palette by state
  const fill = status === "error" ? "#2a0a14" : "#0a1a26";
  const stroke =
    status === "error"
      ? "#ff6a6a"
      : status === "thinking"
        ? "#e6a559"
        : "#7cff93";
  const dotColor = stroke;
  const dotDim = status === "error" ? "#5a2230" : "#1f3a2a";

  // Main cloud — 9×6 pixels of puffy, with a couple of little bumps
  // to feel like a comic-strip thought cloud rather than a plain pill.
  const w = 11;
  const h = 7;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);

  // Backing + stroke (stroke drawn as 1px offset rects so it stays pixel-crisp)
  ctx.fillStyle = stroke;
  // top bumps
  ctx.fillRect(x + 1, y - 1, 3, 1);
  ctx.fillRect(x + w - 4, y - 1, 3, 1);
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillRect(x + 2, y - 0, 1, 1);
  ctx.fillRect(x + w - 3, y - 0, 1, 1);

  // 3 dots cycling — each on for ~240ms in sequence, so the whole cycle is ~960ms.
  // (Classic chat "thinking" ellipsis.)
  const phase = Math.floor(now / 240) % 4; // 0,1,2 = dots lit; 3 = all on briefly
  const dots: [number, number][] = [
    [cx - 3, cy + 0],
    [cx + 0, cy + 0],
    [cx + 3, cy + 0],
  ];
  dots.forEach(([dx, dy], i) => {
    const lit = phase === 3 || phase === i || (phase === (i + 1) % 4);
    ctx.fillStyle = lit ? dotColor : dotDim;
    ctx.fillRect(Math.round(dx), Math.round(dy), 1, 1);
  });

  // Two tiny tail squares (shrinking) pointing down toward the character
  ctx.fillStyle = stroke;
  ctx.fillRect(Math.round(cx) - 1, y + h + 0, 2, 2);
  ctx.fillRect(Math.round(cx), y + h + 3, 1, 1);
}

/** Blend a hex color toward black (-1) or white (+1) by `amount`. */
function shade(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  const mix = (c: number) =>
    Math.max(0, Math.min(255,
      amount < 0 ? c * (1 + amount) : c + (255 - c) * amount,
    ));
  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

/* ──────────────────────────────────────────────────────────────
   Porthole + hatch (procedural)
   ────────────────────────────────────────────────────────────── */

function drawPortholeCutout(ctx: CanvasRenderingContext2D) {
  const { cx, cy, r } = PORTHOLE_RECT;
  const px = cx * TILE;
  const py = cy * TILE;
  const pr = r  * TILE;

  // Abyss fill
  const g = ctx.createRadialGradient(px, py, 2, px, py, pr);
  g.addColorStop(0,    "#1a4868");
  g.addColorStop(0.55, "#0a2a44");
  g.addColorStop(1,    "#010812");
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Brass rim
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.strokeStyle = "#d49a4a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py, pr - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#7a4e22";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rivets on rim
  for (let i = 0; i < 12; i++) {
    const a  = (i / 12) * Math.PI * 2;
    const rx = px + Math.cos(a) * (pr - 1);
    const ry = py + Math.sin(a) * (pr - 1);
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(rx - 0.5, ry - 0.5, 1, 1);
  }

  // Marine snow — 8 specks, one tinged bioluminescent
  const seeds: Array<[number, number, boolean]> = [
    [-10, -4, false], [-4,  8, false], [ 6, -9, true ],
    [12,  2, false], [-7, -12,true ], [-14, 3, false],
    [ 3, 14, false], [ 9, 10, true ],
  ];
  for (const [ox, oy, bio] of seeds) {
    if (ox * ox + oy * oy > (pr - 4) ** 2) continue;
    ctx.fillStyle = bio ? "#7cff93" : "rgba(232,241,234,0.65)";
    ctx.fillRect(px + ox, py + oy, 1, 1);
  }

  // Tiny fish silhouette
  ctx.fillStyle = "#010812";
  ctx.fillRect(px - 6, py + 4, 4, 2);
  ctx.fillRect(px - 2, py + 3, 2, 1);
  ctx.fillRect(px - 2, py + 6, 2, 1);
}

function drawHatchCutout(ctx: CanvasRenderingContext2D) {
  const { cx, cy, r } = HATCH_RECT;
  const px = cx * TILE;
  const py = cy * TILE;
  const pr = r  * TILE;

  // Outer well
  ctx.beginPath();
  ctx.arc(px, py, pr + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#061622";
  ctx.fill();

  // Brass ring
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fillStyle = "#9c6f3b";
  ctx.fill();

  // Inner well
  ctx.beginPath();
  ctx.arc(px, py, pr - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#142a3d";
  ctx.fill();

  // Rivets on ring
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2;
    const rx = px + Math.cos(a) * (pr - 1);
    const ry = py + Math.sin(a) * (pr - 1);
    ctx.fillStyle = "#1d3a52";
    ctx.fillRect(rx - 0.5, ry - 0.5, 1, 1);
  }

  // Valve spokes
  ctx.strokeStyle = "#e6a559";
  ctx.lineWidth = 1;
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(a) * (pr - 3), py + Math.sin(a) * (pr - 3));
    ctx.stroke();
    ctx.fillStyle = "#e6a559";
    ctx.fillRect(
      px + Math.cos(a) * (pr - 3) - 1,
      py + Math.sin(a) * (pr - 3) - 1,
      2, 2,
    );
  }

  // Hub
  ctx.beginPath();
  ctx.arc(px, py, 2, 0, Math.PI * 2);
  ctx.fillStyle = "#5c3f1f";
  ctx.fill();
}

/* ──────────────────────────────────────────────────────────────
   Nameplates under each station
   ────────────────────────────────────────────────────────────── */

function drawStationNameplates(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.font = '6px "Silkscreen", monospace';
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.imageSmoothingEnabled = false;

  for (const s of STATIONS) {
    // Nameplate sits on the desk front (facing down → right below desk row;
    // facing up → right above desk row). For Dean, center on the 4-wide desk.
    const plateCx = (s.desk.x + s.desk.w / 2) * TILE;
    const plateCy = s.facing === "down"
      ? (s.desk.y + s.desk.h) * TILE + 0     // just under the desk
      : (s.desk.y) * TILE - 8;               // just above the desk

    const label = s.label.toUpperCase();
    const pad = 3;
    const w   = label.length * 3.2 + pad * 2;
    const h   = 7;

    const g = ctx.createLinearGradient(
      plateCx - w / 2, plateCy, plateCx - w / 2, plateCy + h,
    );
    g.addColorStop(0, "#e6a559");
    g.addColorStop(1, "#9c6f3b");
    ctx.fillStyle = g;
    ctx.fillRect(plateCx - w / 2, plateCy, w, h);

    ctx.strokeStyle = "#0a1a26";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(plateCx - w / 2 + 0.5, plateCy + 0.5, w - 1, h - 1);

    ctx.fillStyle = "#0a1a26";
    ctx.fillText(label, plateCx, plateCy + 1);
  }
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────────
   TileAtlas dev overlay (unchanged)
   ────────────────────────────────────────────────────────────── */

function TileAtlas() {
  return (
    <div
      className="absolute inset-0 z-50 overflow-auto"
      style={{ background: "rgba(3,18,30,0.96)" }}
    >
      <div className="p-6">
        <div className="pixel-text mb-4"
          style={{ color: "var(--brass)", fontSize: 12, letterSpacing: "0.2em" }}>
          TILE ATLAS — `~` TO CLOSE
        </div>
        <AtlasSheet title="OFFICE — 16x32" src={SHEET_OFFICE} cols={16} rows={32} />
        <AtlasSheet title="CHARS — 27x18"  src={SHEET_CHARS}  cols={27} rows={18} />
      </div>
    </div>
  );
}

function AtlasSheet({
  title, src, cols, rows,
}: { title: string; src: string; cols: number; rows: number }) {
  const scale = 3;
  return (
    <div className="mb-8">
      <div className="hud-text mb-2"
        style={{ color: "var(--bio)", fontSize: 14, letterSpacing: "0.2em" }}>
        {title}
      </div>
      <div
        className="relative"
        style={{
          width:  cols * TILE * scale,
          height: rows * TILE * scale,
          backgroundImage: `url(${src})`,
          backgroundSize: `${cols * TILE * scale}px ${rows * TILE * scale}px`,
          imageRendering: "pixelated",
          boxShadow: "0 0 0 1px #4dd8d3",
        }}
      >
        <svg className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none">
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i} y1={0} x2={i} y2={rows}
              stroke="rgba(77,216,211,0.15)" strokeWidth={0.02} />
          ))}
          {Array.from({ length: rows + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i} x2={cols} y2={i}
              stroke="rgba(77,216,211,0.15)" strokeWidth={0.02} />
          ))}
        </svg>
        {Array.from({ length: Math.ceil(cols / 4) + 1 }).map((_, i) => (
          <span key={`cx${i}`} className="hud-text absolute"
            style={{
              left: i * 4 * TILE * scale, top: -16,
              color: "var(--kelp)", fontSize: 11, letterSpacing: "0.1em",
            }}>
            c{i * 4}
          </span>
        ))}
        {Array.from({ length: Math.ceil(rows / 4) + 1 }).map((_, i) => (
          <span key={`ry${i}`} className="hud-text absolute"
            style={{
              top: i * 4 * TILE * scale - 6, left: -28,
              color: "var(--kelp)", fontSize: 11, letterSpacing: "0.1em",
            }}>
            r{i * 4}
          </span>
        ))}
      </div>
    </div>
  );
}

function DevHint() {
  return (
    <div className="hud-text absolute right-2 top-2 z-20 rounded px-2 py-1"
      style={{
        fontSize: 12,
        color: "rgba(77,216,211,0.6)",
        letterSpacing: "0.18em",
        background: "rgba(3,18,30,0.6)",
        boxShadow: "0 0 0 1px rgba(77,216,211,0.15)",
      }}>
      TILDE · TILE ATLAS
    </div>
  );
}
