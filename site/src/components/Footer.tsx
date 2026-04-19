import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-wrap">
        <div className="footer-brand">
          <span className="pix footer-word">advisr</span>
          <span className="mono footer-tag">
            // the counseling office · education &amp; social justice · solo build
          </span>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <span className="mono col-label">office hours</span>
            <ul>
              <li>24 / 7 · every kid, not just the ones who can pay</li>
              <li>encrypted at rest · user-owned graph · never trained on</li>
            </ul>
          </div>

          <div className="footer-col">
            <span className="mono col-label">prior art</span>
            <ul>
              <li>
                <a href="https://github.com/qtzx06/memopal" target="_blank" rel="noreferrer">
                  memopal — the knowledge graph lineage
                </a>
              </li>
              <li>
                <a href="https://github.com/pablodelucca/pixel-agents" target="_blank" rel="noreferrer">
                  pixel-agents — the animation state pattern
                </a>
              </li>
              <li>karpathy — llms as personal knowledge bases</li>
            </ul>
          </div>

          <div className="footer-col">
            <span className="mono col-label">scope</span>
            <ul>
              <li>v1 · college counseling</li>
              <li>v2 · legal navigation</li>
              <li>v…·· any field where a team of specialists is a paywall</li>
            </ul>
          </div>
        </div>

        <div className="footer-meta mono">
          <span>© {new Date().getFullYear()} advisr — built solo by matthew kim</span>
          <span className="footer-flex"><span className="dot" /> office open</span>
        </div>
      </div>
    </footer>
  );
}
