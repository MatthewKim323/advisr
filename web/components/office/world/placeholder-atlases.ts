"use client";

/**
 * Procedural stand-ins when Donarg/Kenney PNGs are absent from
 * `web/public/sprites/` (not committed — see README there).
 * Keeps the submarine readable in a fresh clone without vendor packs.
 */

import { CHARS, TILE, charFrame, type Facing } from "./assets";

const OFFICE_W = 256;
const OFFICE_H = 512;
const CHARS_W = 432;
const CHARS_H = 288;

const FACINGS: Facing[] = ["down", "up", "left", "right"];

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode placeholder data URL"));
    img.src = dataUrl;
  });
}

/** Steel deck pattern — same dimensions as Donarg 16×32 @ 16px. */
export async function createPlaceholderOfficeImage(): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = OFFICE_W;
  canvas.height = OFFICE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context");

  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 16; col++) {
      const v = 32 + ((row * 3 + col * 7) % 48);
      ctx.fillStyle = `rgb(${38 + (v % 20)}, ${48 + (v % 25)}, ${62 + (v % 18)})`;
      ctx.fillRect(col * 16, row * 16, 16, 16);
    }
  }
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, 0);
    ctx.lineTo(i * 16, OFFICE_H);
    ctx.stroke();
  }
  for (let j = 0; j <= 32; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * 16);
    ctx.lineTo(OFFICE_W, j * 16);
    ctx.stroke();
  }

  return dataUrlToImage(canvas.toDataURL("image/png"));
}

/** Tiny silhouettes at every Kenney tile coord the renderer samples. */
export async function createPlaceholderCharsImage(): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = CHARS_W;
  canvas.height = CHARS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context");

  ctx.fillStyle = "#0a1820";
  ctx.fillRect(0, 0, CHARS_W, CHARS_H);

  const hues = ["#c9a87c", "#8fb3c4", "#7cff93", "#e6a559", "#a8c4e8", "#d4a574", "#9bdc9b"];
  let hi = 0;
  for (const c of Object.values(CHARS)) {
    const body = hues[hi++ % hues.length];
    for (const facing of FACINGS) {
      const { col, row } = charFrame(c, facing, 0);
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = "#1a2a35";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = body;
      ctx.fillRect(x + 4, y + 5, 8, 9);
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(x + 5, y + 3, 6, 4);
    }
  }

  return dataUrlToImage(canvas.toDataURL("image/png"));
}
