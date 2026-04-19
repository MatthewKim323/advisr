import "./Manifesto.css";

export default function Manifesto() {
  return (
    <section className="manifesto">
      <div className="wrap">
        <div className="manifesto-card">
          <div className="manifesto-lamp" aria-hidden>
            <span className="lamp-head" />
            <span className="lamp-arm" />
            <span className="lamp-base" />
            <span className="lamp-glow" />
          </div>

          <div className="manifesto-copy">
            <div className="mono manifesto-eyebrow">// the pitch</div>
            <p className="manifesto-text serif-ital">
              This is what a{" "}
              <span className="num pix">$50,000</span> counseling package
              looks like.
              <br />
              We built it.
              <br />
              For <em>free.</em>
              <br />
              For <em>anyone.</em>
            </p>

            <div className="manifesto-ctas">
              <a href="#office" className="btn">
                Walk into the office
                <span aria-hidden>→</span>
              </a>
              <a
                href="https://github.com/qtzx06/memopal"
                target="_blank"
                rel="noreferrer"
                className="btn ghost"
              >
                Read the plan
              </a>
            </div>

            <p className="manifesto-foot mono">
              college counseling is v1. the architecture generalizes to any
              domain where rich people buy a team of specialists and poor
              people don't have one — legal navigation, healthcare, financial
              planning. advisr is the first node.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
