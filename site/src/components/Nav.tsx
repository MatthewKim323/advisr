import "./Nav.css";
import { SUBMARINE_URL } from "../config";

export default function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-row">
        <a href="#top" className="nav-brand" aria-label="Nami, home">
          <span className="nav-logo" aria-hidden>
            <span className="nav-logo-pixel" />
          </span>
          <span className="pix nav-wordmark">nami</span>
          <span className="mono nav-sub">//&nbsp;the tsunami is on its way</span>
        </a>

        <nav className="nav-links">
          <a href="#office">Office</a>
          <a href="#team">Team</a>
          <a href="#memory">Memory</a>
          <a href="#flow">Flow</a>
        </nav>

        <a href={SUBMARINE_URL} className="nav-cta mono">
          <span className="dot" />
          board submarine
        </a>
      </div>
    </header>
  );
}
