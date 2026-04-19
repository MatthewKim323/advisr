import "./Flow.css";

type Step = {
  n: string;
  title: string;
  actor: string;
  body: string;
  event: string;
  tone: "paper" | "teal" | "lamp" | "rust" | "plum";
};

const steps: Step[] = [
  {
    n: "01",
    title: "Drop your stuff.",
    actor: "Student",
    body:
      "Transcript, essays, activities, voice memos, financial info, even a photo. Everything is stored, nothing is thrown away. Every future claim will trace back here.",
    event: "file_uploaded · source_files[+8]",
    tone: "paper",
  },
  {
    n: "02",
    title: "Archivist wakes the room.",
    actor: "Archivist → parser workers",
    body:
      "Archivist spawns TranscriptReader, EssayParser, FinancialParser, VoiceTranscriber, PhotoAnalyzer. Files fly across the office. A knowledge-graph constellation begins to build.",
    event: "ingestion_started · claims_proposed · 73",
    tone: "teal",
  },
  {
    n: "03",
    title: "You confirm what's yours.",
    actor: "Student · ProposalQueue",
    body:
      "Every new claim arrives pending. You see the confidence score, the source file, and the reasoning. You accept, edit, or reject. Only confirmed claims become truth downstream.",
    event: "claim_confirmed · 61/73 · 12 rejected",
    tone: "lamp",
  },
  {
    n: "04",
    title: "Chat with Dean.",
    actor: "Dean (orchestrator)",
    body:
      "You ask a question. Dean reads the whole graph, decides which specialist to pull in, and delegates. Characters get up from desks. Laptops open. The office starts working.",
    event: "agent_delegating · from: dean → match-maker",
    tone: "lamp",
  },
  {
    n: "05",
    title: "The specialists bring back real work.",
    actor: "Match-Maker · Bursar · Scout · Draft · Pacer",
    body:
      "A personalized school list. True cost at five schools in parallel. Scholarships you actually qualify for. Essay feedback that knows your other essays. Deadlines that ping you first.",
    event: "tool_call_finished · 5 laptops · 12.3s",
    tone: "rust",
  },
  {
    n: "06",
    title: "They remember you tomorrow.",
    actor: "The graph persists",
    body:
      "Come back next week, the office knows where you left off. Finished the UC PIQ? Draft catches that you reused the grandmother theme — and reminds you the Mr. Arellano propeller story is stronger.",
    event: "graph.query · returning_student · resume_context",
    tone: "plum",
  },
];

export default function Flow() {
  return (
    <section id="flow" className="flow">
      <div className="wrap">
        <div className="section-label">// the flow · one student, one session</div>
        <h2 className="section-title">
          What happens when you <em>walk in.</em>
        </h2>
        <p className="section-sub">
          Six beats from drop-off to personalized output. Each one emits
          events the office canvas subscribes to — so what you're reading
          here is literally what the judges will watch happen on screen.
        </p>

        <ol className="flow-list">
          {steps.map((s) => (
            <li key={s.n} className={`flow-step flow-${s.tone}`}>
              <div className="step-num pix">{s.n}</div>
              <div className="step-body">
                <div className="step-actor mono">{s.actor}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.body}</p>
                <div className="step-event mono">
                  <span className="event-dot" />
                  {s.event}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
