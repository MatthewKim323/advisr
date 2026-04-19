"use client";

/**
 * The PixiJS canvas. Renders the office, hosts the character state machines,
 * and subscribes to the event bus.
 *
 * Build layers (see PLAN.md §6):
 *   0. Asset library loaded (Donarg's Office Interior + Kenney extras)
 *   1. Static office — desks, chairs, 7 idle characters
 *   2. State-driven animation — walk, type, read, speak
 *   3. Browser-use overlay — live laptop stream when `browse` state fires
 *   4. Knowledge graph constellation — particles fly to Archivist's desk
 *   5. Polish — ambient, sound, particles, lighting
 */
export default function Canvas() {
  // TODO: mount a <canvas> + PixiJS app; feed events from useOfficeEvents().
  return (
    <div className="aspect-video w-full bg-[#0a1311] border border-[#f1e4c5]/10 grid place-items-center text-[#f1e4c5]/40 font-mono text-xs">
      // office.canvas — mount PixiJS here
    </div>
  );
}
