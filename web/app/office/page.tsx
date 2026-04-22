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
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--abyss-deep, #071521)" }}
    >
      <OfficeHUD
        crewBadge={<CrewBadge />}
        studentId={studentId}
        manifestToggle={<ProposalDrawerToggle />}
      />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_420px]">
        <div className="relative overflow-hidden">
          <Canvas />
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
            style={{ top: 24 }}
          >
            <SearchBar studentId={studentId} />
          </div>
          <DeanInterjectionLayer />
          <DropZone studentId={studentId} />
          <ProposalDrawer studentId={studentId} />
          <LocalIndexBootstrap studentId={studentId} />
        </div>
        <ChatPanel />
      </div>
    </main>
  );
}
