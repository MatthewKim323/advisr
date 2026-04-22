"use client";

/**
 * Canvas — the pixel-rendered submarine office.
 *
 * The hull is capsule-shaped; the area outside the hull is intentionally
 * left blank (flat neutral color) so the ocean/shader layer can be
 * dropped in behind later.
 */

import PixelWorld from "./world/PixelWorld";

export default function Canvas() {
  return (
    <div
      className="relative isolate flex h-full w-full items-center justify-center overflow-hidden px-4 py-3"
      style={{
        // Placeholder — an ocean shader will live here eventually.
        background: "#071521",
      }}
    >
      <PixelWorld />
    </div>
  );
}
