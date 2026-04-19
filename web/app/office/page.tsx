import Canvas from "@/components/office/Canvas";
import ChatPanel from "@/components/chat/ChatPanel";
import OfficeHUD from "@/components/office/OfficeHUD";
import SearchBar from "@/components/office/SearchBar";
import KnowledgeConstellation from "@/components/office/KnowledgeConstellation";
import DeanInterjectionLayer from "@/components/office/DeanInterjectionLayer";
import DropZone from "@/components/office/DropZone";
import ProposalDrawer from "@/components/office/ProposalDrawer";
import LocalIndexBootstrap from "@/components/office/LocalIndexBootstrap";
import CrewBadge from "@/components/auth/CrewBadge";
import { DEMO_STUDENT_ID } from "@/lib/utils/env";

/**
 * /office — the counseling office. Student-facing.
 *
 *   ┌─────────────────────────────────────────────┐
 *   │                  OFFICE HUD                  │
 *   ├──────────────────────────────┬──────────────┤
 *   │        SEARCH BAR (F1)        │              │
 *   │    CANVAS (pixel office) +    │    CHAT      │
 *   │   KnowledgeConstellation      │    PANEL     │
 *   │   DropZone overlay + Log      │              │
 *   │   ProposalDrawer (slide-in)   │              │
 *   │   DeanInterjectionLayer       │              │
 *   └──────────────────────────────┴──────────────┘
 *
 * All overlays mount inside the canvas column so the chat column stays
 * predictable at 420px. The DropZone listens at document level so drops
 * anywhere on the page still funnel through /api/upload.
 */
export default function OfficePage() {
  const studentId = DEMO_STUDENT_ID;

  return (
    <main
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--abyss-deep, #071521)" }}
    >
      <OfficeHUD crewBadge={<CrewBadge />} studentId={studentId} />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_420px]">
        <div className="relative overflow-hidden">
          <Canvas />
          <div className="pointer-events-none absolute inset-0 z-10">
            <KnowledgeConstellation studentId={studentId} />
          </div>
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
