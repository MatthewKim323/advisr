import "./Memory.css";

type Claim = {
  id: string;
  predicate: string;
  object: string;
  confidence: number;
  status: "confirmed" | "pending";
  source: string;
  extractor: string;
  reasoning: string;
};

const claims: Claim[] = [
  {
    id: "c_001",
    predicate: "takes_course",
    object: "AP_Biology",
    confidence: 0.99,
    status: "confirmed",
    source: "transcript.pdf · p.2, row 14",
    extractor: "TranscriptReader",
    reasoning: "Course row found under 11th grade, AP designation in column 3.",
  },
  {
    id: "c_018",
    predicate: "identifies_as_religion",
    object: "Catholic",
    confidence: 0.87,
    status: "pending",
    source: "confirmation_photo.jpg",
    extractor: "PhotoAnalyzer",
    reasoning: "White dress + candle + church altar context → first communion / confirmation. Needs user confirm.",
  },
  {
    id: "c_032",
    predicate: "family_income",
    object: "$47,200",
    confidence: 0.99,
    status: "confirmed",
    source: "1040_2024.pdf · line 11",
    extractor: "FinancialParser",
    reasoning: "AGI read from tax return. Pell-eligible at household size 3.",
  },
  {
    id: "c_047",
    predicate: "essay_weakness",
    object: "cliché: grandmother + food",
    confidence: 0.82,
    status: "pending",
    source: "common_app_v3.docx",
    extractor: "EssayParser",
    reasoning: "Grandmother teaching recipe is a top-10 admissions cliché. Voice memo has unrelated, stronger story (Mr. Arellano + propeller).",
  },
  {
    id: "c_061",
    predicate: "dream_school",
    object: "Harvey Mudd",
    confidence: 0.78,
    status: "pending",
    source: "voice_memo.mp3 · 02:14",
    extractor: "VoiceTranscriber",
    reasoning: "'…if I could go anywhere it'd probably be Harvey Mudd but I don't want to say that out loud.'",
  },
];

export default function Memory() {
  return (
    <section id="memory" className="memory">
      <div className="wrap">
        <div className="section-label">// the memory layer</div>
        <h2 className="section-title">
          Every claim cites its <em>source.</em>
        </h2>
        <p className="section-sub">
          Most AI counseling tools are stateless chatbots — the conversation
          ends, the LLM forgets. Nami replaces that with a persistent,
          evidence-backed knowledge graph. Every downstream agent queries{" "}
          <em>who the student actually is</em> instead of re-deriving context
          on every turn. Before a claim becomes truth, the student approves it.
        </p>

        <div className="memory-table">
          <div className="memory-head mono">
            <span>claim</span>
            <span>predicate · object</span>
            <span>evidence</span>
            <span className="center">confidence</span>
            <span className="center">status</span>
          </div>

          {claims.map((c) => (
            <article key={c.id} className={`claim claim-${c.status}`}>
              <div className="claim-id mono">{c.id}</div>

              <div className="claim-pred">
                <div className="pred-line">
                  <span className="pred-chip mono">student</span>
                  <span className="pred-arrow">→</span>
                  <span className="pred-name pix">{c.predicate}</span>
                  <span className="pred-arrow">→</span>
                  <span className="pred-obj pix">{c.object}</span>
                </div>
                <div className="pred-reason serif-ital">
                  "{c.reasoning}"
                </div>
              </div>

              <div className="claim-source">
                <span className="source-file mono">{c.source}</span>
                <span className="source-by mono">
                  via <strong>{c.extractor}</strong>
                </span>
              </div>

              <div className="claim-conf">
                <div className="conf-bar">
                  <div
                    className="conf-fill"
                    style={{ width: `${c.confidence * 100}%` }}
                  />
                </div>
                <span className="mono">{c.confidence.toFixed(2)}</span>
              </div>

              <div className="claim-status">
                <span className={`status-pill status-${c.status}`}>
                  {c.status === "confirmed" ? "✓ confirmed" : "? pending"}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="memory-footnote mono">
          <span className="fn-dot" />
          4 core tables · ~70 typed predicates · append-only · human-in-the-loop gate.
          Embeddings, fine-grained evidence, and relationships deferred to post-MVP.
        </div>
      </div>
    </section>
  );
}
