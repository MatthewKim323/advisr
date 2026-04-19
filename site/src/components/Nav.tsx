import "./Nav.css";

export default function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-row">
        <a href="#top" className="nav-brand" aria-label="Advisr, home">
          <span className="nav-logo" aria-hidden>
            <span className="nav-logo-pixel" />
          </span>
          <span className="pix nav-wordmark">advisr</span>
          <span className="mono nav-sub">//&nbsp;the counseling office</span>
        </a>

        <nav className="nav-links">
          <a href="#office">Office</a>
          <a href="#team">Team</a>
          <a href="#memory">Memory</a>
          <a href="#flow">Flow</a>
        </nav>

        <a href="#office" className="nav-cta mono">
          <span className="dot" />
          open 24/7
        </a>
      </div>
    </header>
  );
}
