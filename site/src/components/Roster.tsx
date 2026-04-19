import "./Roster.css";

type Agent = {
  id: string;
  name: string;
  role: string;
  accent: "lamp" | "rust" | "teal" | "plum" | "paper";
  glyph: string;
  tools: string;
  model: string;
  tagline: string;
  killer: string;
};

const agents: Agent[] = [
  {
    id: "dean",
    name: "Dean",
    role: "Head Counselor · Orchestrator",
    accent: "lamp",
    glyph: "D",
    tools: "all specialists · full graph read",
    model: "Claude Sonnet 4.5",
    tagline:
      "Greets the student. Holds the conversation. Decides which specialist to pull in.",
    killer: "I've worked with a thousand students. I know what this moment feels like.",
  },
  {
    id: "archivist",
    name: "Archivist",
    role: "Memory · Knowledge Graph",
    accent: "teal",
    glyph: "A",
    tools: "spawns: Transcript · Essay · Activity · Financial · Voice · Photo",
    model: "Sonnet 4.5 + Haiku workers",
    tagline:
      "Ingests every artifact. Delegates parsing to workers. Keeps the evidence-backed graph of who the student actually is.",
    killer: "Every claim cites its source. No source → no claim. Period.",
  },
  {
    id: "matchmaker",
    name: "Match-Maker",
    role: "School Strategist",
    accent: "paper",
    glyph: "M",
    tools: "browser-use · College Scorecard + Niche · Common Data Set cache",
    model: "Claude Sonnet 4.5",
    tagline:
      "Builds a personalized list with safety / target / reach tiers. Finds hidden-gem schools where the student has an advantage.",
    killer: "Admit rate × demographic admit rate × institutional fit × net cost × outcome by major.",
  },
  {
    id: "bursar",
    name: "Bursar",
    role: "Financial Aid Advisor",
    accent: "rust",
    glyph: "B",
    tools: "browser-use × 5 in parallel · school NPCs · FAFSA SAI translator",
    model: "Claude Sonnet 4.5",
    tagline:
      "Spawns 5 parallel browsers against 5 Net Price Calculators. Returns true cost side-by-side.",
    killer: "Five schools. Five financial aid offices. Twelve seconds.",
  },
  {
    id: "scout",
    name: "Scout",
    role: "Scholarship Hunter",
    accent: "plum",
    glyph: "S",
    tools: "browser-use · eligibility filter backed by graph claims",
    model: "Claude Sonnet 4.5",
    tagline:
      "Scans scholarship platforms with surgical precision. Filters by demographics, interests, activities, financial need, intended major.",
    killer: "Reads the graph, knows exactly which $3K scholarship is a $3K scholarship for her.",
  },
  {
    id: "draft",
    name: "Draft",
    role: "Essay Coach",
    accent: "lamp",
    glyph: "✍",
    tools: "pure LLM · graph-aware · progressive revision mode",
    model: "Claude Sonnet 4.5",
    tagline:
      "Surgical feedback. Catches cliché, voice drift, weak structure. Progressive over three passes, like a real coach.",
    killer: "You wrote about your grandmother in Common App. Doing it again in UC PIQ is weak. Your voice memo has a stronger story — try that.",
  },
  {
    id: "pacer",
    name: "Pacer",
    role: "Deadline Manager",
    accent: "paper",
    glyph: "P",
    tools: "scheduled jobs · graph queries · calendar",
    model: "Claude Haiku",
    tagline:
      "Tracks every deadline — applications, FAFSA, CSS Profile, scholarships, supplementals. Pings before things go critical.",
    killer: "Every other AI waits for you to ask. Nami wakes up and tells you what you should be doing.",
  },
];

export default function Roster() {
  return (
    <section id="team" className="roster">
      <div className="wrap">
        <div className="section-label">// the tsunami · seven specialists</div>
        <h2 className="section-title">
          Meet the <em>Tsunami.</em>
        </h2>
        <p className="section-sub">
          Dean plus six specialists — the <em>Tsunami</em>. Each has a role,
          a personality, a set of tools, and a desk in the office. They're not
          fancy wrappers on the same model — they're specialists. Dean routes
          the conversation. The other six bring back real work.
        </p>

        <div className="roster-grid">
          {agents.map((a, i) => (
            <article key={a.id} className={`agent agent-${a.accent}`}>
              <header className="agent-head">
                <div className="agent-badge">
                  <span className="agent-glyph pix">{a.glyph}</span>
                  <span className="agent-stripe" />
                </div>
                <div className="agent-ident">
                  <span className="mono agent-id">No. 0{i + 1} / 07</span>
                  <h3 className="pix agent-name">{a.name}</h3>
                  <span className="mono agent-role">{a.role}</span>
                </div>
              </header>

              <p className="agent-tag">{a.tagline}</p>

              <dl className="agent-meta">
                <div>
                  <dt className="mono">tools</dt>
                  <dd>{a.tools}</dd>
                </div>
                <div>
                  <dt className="mono">model</dt>
                  <dd>{a.model}</dd>
                </div>
              </dl>

              <blockquote className="agent-quote serif-ital">
                "{a.killer}"
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
