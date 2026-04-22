import Canvas from "@/components/office/Canvas";
import ChatPanel from "@/components/chat/ChatPanel";
import OfficeHUD from "@/components/office/OfficeHUD";
import SearchBar from "@/components/office/SearchBar";
import DeanInterjectionLayer from "@/components/office/DeanInterjectionLayer";
import DropZone from "@/components/office/DropZone";
import ProposalDrawer, {
  ProposalDrawerToggle,
} from "@/components/office/ProposalDrawer";
import LocalIndexBootstrap from "@/components/office/LocalIndexBootstrap";
import CrewBadge from "@/components/auth/CrewBadge";
import { DEMO_STUDENT_ID } from "@/lib/utils/env";

/**
 * /office — the counseling office. Student-facing.
 *
 *   ┌────────────────────────────────────────┬──────────────┐
 *   │ OfficeHUD  · · ·   [MANIFEST] [BRIEF] [DEMO·MARIA]   │
 *   ├────────────────────────────────────────┤              │
 *   │          SearchBar (F1, top)           │              │
 *   │        CANVAS (pixel office)           │    CHAT      │
 *   │        DropZone overlay + Log          │    PANEL     │
 *   │        ProposalDrawer (slide-in)       │              │
 *   │        DeanInterjectionLayer           │              │
 *   │  [↓ UPLOAD]            (TransitLog)    │              │
 *   └────────────────────────────────────────┴──────────────┘
 *
 * Layout rules after the UX cleanup (Human Delta demo build):
 *   - All secondary HUD controls (BRIEF pdf, MANIFEST toggle) live inside
 *     `OfficeHUD`'s top bar, so they never float over ChatPanel or compete
 *     with the primary UPLOAD CTA.
 *   - Only UPLOAD stays as a floating bottom CTA — it's the one action a
 *     judge needs to reach without thinking.
 *   - `KnowledgeConstellation` is intentionally *not* mounted here. It
 *     was a full-bleed overlay with `pointer-events-auto` that intercepted
 *     clicks to the pixel station hotspots. The force-graph view lives
 *     on `/archivist`.
 */
export default function OfficePage() {
  const studentId = DEMO_STUDENT_ID;

  return (
    <main
      className="relative flex h-screen flex-col overflow-hidden"
      style={{ background: "var(--abyss-deep, #071521)" }}
    >
      <OfficeHUD
        crewBadge={<CrewBadge />}
        studentId={studentId}
        manifestToggle={<ProposalDrawerToggle />}
      />

      {/* Single-viewport split: canvas (+ overlays) on the left, chat
          on the right. `min-h-0` on the grid and its cells is critical —
          without it, a flex child grows to its natural content height
          (the pixel canvas's aspect-scaled size) and pushes the page
          past 100vh, forcing the scroll the user called out. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
        <div className="relative min-h-0 overflow-hidden">
          <Canvas />
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
            style={{ top: 16 }}
          >
            <SearchBar studentId={studentId} />
          </div>
          <DeanInterjectionLayer />
          <DropZone studentId={studentId} />
          <ProposalDrawer studentId={studentId} />
          <LocalIndexBootstrap studentId={studentId} />
        </div>
        <div className="min-h-0">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
