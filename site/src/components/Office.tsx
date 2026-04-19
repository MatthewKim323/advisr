import "./Office.css";

export default function Office() {
  return (
    <section id="office" className="office">
      <div className="wrap">
        <div className="office-head">
          <div>
            <div className="section-label">// the pixel office</div>
            <h2 className="section-title">
              A whole <em>office</em> for every student.
            </h2>
            <p className="section-sub">
              Seven specialists, one student, one shared memory. The office
              is literal — you watch characters stand up, walk to each other,
              open laptops running real browser automation, and build a
              knowledge graph together in real time. Judges don't squint at a
              dashboard. They watch a film.
            </p>
          </div>

          <ul className="office-legend mono">
            <li><span className="dot lamp" /> active now</li>
            <li><span className="dot teal" /> reading graph</li>
            <li><span className="dot plum" /> browser live</li>
            <li><span className="dot paper" /> idle at desk</li>
          </ul>
        </div>

        <div className="floorplan">
          <div className="fp-chrome mono">
            <span>office.floor</span>
            <span className="fp-chrome-right">grid · 32 × 32 · 16px</span>
          </div>

          <div className="fp-canvas">
            <div className="fp-floor" />

            {/* labeled desk cells */}
            {zones.map((z) => (
              <div
                key={z.key}
                className={`zone zone-${z.accent}`}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.w}%`,
                  height: `${z.h}%`,
                }}
              >
                <div className="zone-inner">
                  <div className="zone-sprite">
                    <span className="zone-lamp" />
                    <span className="zone-avatar" />
                  </div>
                  <div className="zone-meta">
                    <span className="pix zone-name">{z.name}</span>
                    <span className="mono zone-role">{z.role}</span>
                    {z.state && (
                      <span className="mono zone-state">
                        <span className="state-dot" /> {z.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Student couch center */}
            <div
              className="zone zone-couch"
              style={{ left: "37%", top: "45%", width: "26%", height: "14%" }}
            >
              <div className="zone-inner">
                <div className="zone-sprite student">
                  <span className="zone-avatar" />
                </div>
                <div className="zone-meta">
                  <span className="pix zone-name">Student</span>
                  <span className="mono zone-role">visitor couch</span>
                </div>
              </div>
            </div>

            {/* File drop at the bottom */}
            <div className="fp-drop">
              <div className="fp-drop-inner">
                <span className="pix">[ file drop zone ]</span>
                <span className="mono">
                  transcript.pdf · essay.docx · voice_memo.mp3 ·
                  financial.pdf · confirmation.jpg
                </span>
              </div>
            </div>

            {/* corridor arrows showing handoffs */}
            <svg className="fp-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f4b94a" />
                </marker>
              </defs>
              <path d="M 50 20 C 50 30, 22 30, 22 40" stroke="#f4b94a" strokeWidth="0.3" strokeDasharray="1 1.2" fill="none" markerEnd="url(#arrow)" />
              <path d="M 50 20 C 50 30, 78 30, 78 40" stroke="#f4b94a" strokeWidth="0.3" strokeDasharray="1 1.2" fill="none" markerEnd="url(#arrow)" />
              <path d="M 22 62 C 30 65, 40 65, 40 70" stroke="#4f8d89" strokeWidth="0.3" strokeDasharray="1 1.2" fill="none" markerEnd="url(#arrow)" />
              <path d="M 78 62 C 70 65, 60 65, 60 70" stroke="#c25a3e" strokeWidth="0.3" strokeDasharray="1 1.2" fill="none" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </div>

        <div className="office-notes">
          <div className="note">
            <span className="mono note-label">camera</span>
            <p>Spotlight on the active agent. Smooth pans between desks. Judges follow the story, not a grid.</p>
          </div>
          <div className="note">
            <span className="mono note-label">kill shot</span>
            <p>When Bursar runs the 5-school Net Price Calculator pass, five laptops open simultaneously — the retro-pixel × hyper-modern agent contrast that makes judges clip the video.</p>
          </div>
          <div className="note">
            <span className="mono note-label">event bus</span>
            <p>Every agent action emits an event. The canvas subscribes and animates. Never hand-animated — always driven through the state machine.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

type Zone = {
  key: string;
  name: string;
  role: string;
  state?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accent: "lamp" | "teal" | "plum" | "rust" | "paper";
};

const zones: Zone[] = [
  {
    key: "dean",
    name: "Dean",
    role: "head counselor",
    state: "greeting",
    x: 36, y: 4, w: 28, h: 22,
    accent: "lamp",
  },
  {
    key: "match",
    name: "Match-Maker",
    role: "schools",
    state: "filtering list",
    x: 2, y: 30, w: 20, h: 22,
    accent: "paper",
  },
  {
    key: "bursar",
    name: "Bursar",
    role: "financial aid",
    state: "5 browsers live",
    x: 78, y: 30, w: 20, h: 22,
    accent: "rust",
  },
  {
    key: "archivist",
    name: "Archivist",
    role: "memory",
    state: "building graph",
    x: 2, y: 62, w: 20, h: 22,
    accent: "teal",
  },
  {
    key: "pacer",
    name: "Pacer",
    role: "deadlines",
    state: "11 days: FAFSA",
    x: 78, y: 62, w: 20, h: 22,
    accent: "paper",
  },
  {
    key: "scout",
    name: "Scout",
    role: "scholarships",
    state: "browser live",
    x: 22, y: 80, w: 20, h: 18,
    accent: "plum",
  },
  {
    key: "draft",
    name: "Draft",
    role: "essay coach",
    state: "found redundancy",
    x: 58, y: 80, w: 20, h: 18,
    accent: "lamp",
  },
];
