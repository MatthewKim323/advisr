import "./Hero.css";
import { SUBMARINE_URL } from "../config";

const tickerItems = [
  "archivist parsing transcript.pdf",
  "match-maker filtering by catholic+merit+under 35k",
  "bursar spawning 5 parallel npc browsers",
  "draft cross-referencing voice memo → essay redundancy",
  "scout scanning 2,341 scholarships for eligibility",
  "pacer: FAFSA deadline in 11 days",
];

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-grid-bg" aria-hidden />
      <div className="wrap hero-wrap">
        <div className="hero-copy">
          <span className="mono hero-eyebrow">
            <span className="square" />
            education &amp; social justice · solo build
          </span>

          <h1 className="hero-title">
            <span className="pix hero-wordmark">Nami</span>
            <span className="hero-tagline">
              The <em>tsunami</em> <em>every&nbsp;student</em>
              <br />
              deserves.
            </span>
          </h1>

          <p className="hero-lede">
            Rich kids don't get into great schools because they're smarter.
            They get in because they have a <em>team of specialists</em>{" "}
            working on their application. A full-service private counseling
            package costs <strong>$5,000 – $50,000</strong>.
          </p>

          <p className="hero-lede dim">
            Nami is that team — Dean and <em>the Tsunami</em>, six AI
            specialists sharing a persistent, evidence-backed knowledge graph
            of the student, working together inside a pixel-art office you can
            actually watch.
          </p>

          <div className="hero-ctas">
            <a href={SUBMARINE_URL} className="btn">
              Board the submarine
              <span aria-hidden>→</span>
            </a>
            <a href="#team" className="btn ghost">
              Meet the team
            </a>
          </div>

          <dl className="hero-stats">
            <div>
              <dt className="mono">private package</dt>
              <dd className="pix">$50K</dd>
            </div>
            <div>
              <dt className="mono">nami</dt>
              <dd className="pix">$0</dd>
            </div>
            <div>
              <dt className="mono">specialists</dt>
              <dd className="pix">7</dd>
            </div>
          </dl>
        </div>

        <aside className="hero-frame">
          <div className="frame-chrome">
            <span className="frame-dot" />
            <span className="frame-dot" />
            <span className="frame-dot" />
            <span className="frame-label mono">office.cam /live</span>
            <span className="frame-rec">
              <span className="rec-dot" /> REC
            </span>
          </div>

          {/* top-down pixel office */}
          <div className="pixel-room">
            <div className="room-floor" aria-hidden />
            <div className="room-lights" aria-hidden />

            {/* Dean — head of office */}
            <Desk x={45} y={14} label="Dean" color="lamp" role="orchestrator" big />

            {/* Top row: Match-Maker, Bursar, Pacer */}
            <Desk x={12} y={30} label="Match-Maker" color="paper" role="schools" />
            <Desk x={78} y={30} label="Bursar" color="rust" role="financials" typing />

            {/* Archivist, with graph constellation */}
            <Desk x={12} y={58} label="Archivist" color="teal" role="memory" />

            {/* Pacer */}
            <Desk x={78} y={58} label="Pacer" color="paper" role="deadlines" />

            {/* Bottom row: Scout, Draft */}
            <Desk x={28} y={78} label="Scout" color="plum" role="scholarships" browsing />
            <Desk x={62} y={78} label="Draft" color="lamp" role="essay coach" />

            {/* Student couch */}
            <div className="couch" style={{ left: "45%", top: "48%" }} aria-label="Student couch">
              <span className="couch-sprite" />
              <span className="couch-label mono">student</span>
            </div>

            {/* File drop */}
            <div className="filedrop" aria-label="File drop zone">
              <span className="filedrop-label mono">[ drop files here ]</span>
            </div>

            {/* Knowledge graph constellation particles */}
            <div className="constellation" aria-hidden>
              <span className="node n1" />
              <span className="node n2" />
              <span className="node n3" />
              <span className="node n4" />
              <span className="node n5" />
              <span className="edge e1" />
              <span className="edge e2" />
              <span className="edge e3" />
            </div>
          </div>

          <div className="ticker" aria-live="polite">
            <div className="ticker-track">
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <span key={i} className="ticker-item mono">
                  <span className="ticker-dot" /> {t}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

type DeskColor = "lamp" | "rust" | "teal" | "plum" | "paper";

function Desk({
  x,
  y,
  label,
  color,
  role,
  typing,
  browsing,
  big,
}: {
  x: number;
  y: number;
  label: string;
  color: DeskColor;
  role: string;
  typing?: boolean;
  browsing?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={`desk desk-${color} ${big ? "desk-big" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span className="desk-lamp" />
      <span className="desk-surface" />
      <span className={`desk-sprite ${typing ? "is-typing" : ""}`} />
      {browsing && (
        <span className="desk-browser" aria-hidden>
          <span className="browser-row" />
          <span className="browser-row" />
          <span className="browser-row" />
        </span>
      )}
      <span className="desk-tag">
        <span className="pix desk-name">{label}</span>
        <span className="mono desk-role">{role}</span>
      </span>
    </div>
  );
}
