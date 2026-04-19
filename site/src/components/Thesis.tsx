import "./Thesis.css";

export default function Thesis() {
  return (
    <section id="thesis" className="thesis">
      <div className="wrap">
        <div className="thesis-eyebrow mono">
          <span className="square" />
          the thesis
        </div>

        <blockquote className="thesis-quote">
          The gap isn't <em>smarts</em>. It's <em>knowledge</em>
          <br />
          (nobody reads their transcript closely)
          <br />
          and <em>team</em> (nobody has a specialist
          <br />
          for each piece of the puzzle).
        </blockquote>

        <div className="thesis-compare">
          <div className="col">
            <h3 className="pix col-title">The kids with counselors</h3>
            <ul>
              <li><span className="bullet" /> Essay coach who critiques four drafts</li>
              <li><span className="bullet" /> Strategist building the school list</li>
              <li><span className="bullet" /> Financial aid advisor decoding every offer</li>
              <li><span className="bullet" /> Scholarship researcher filing weekly</li>
              <li><span className="bullet" /> Deadline manager who pings the family</li>
              <li><span className="bullet" /> All sharing notes about <em>this one kid</em></li>
            </ul>
            <div className="col-price">
              <span className="mono">avg. package</span>
              <span className="pix">$5K – $50K</span>
            </div>
          </div>

          <div className="col versus">vs.</div>

          <div className="col alt">
            <h3 className="pix col-title">The kids without</h3>
            <ul>
              <li><span className="bullet rust" /> One overworked school counselor for ~400 students</li>
              <li><span className="bullet rust" /> A generic chatbot that forgets them at every turn</li>
              <li><span className="bullet rust" /> A transcript nobody reads closely</li>
              <li><span className="bullet rust" /> A voice memo nobody ever hears</li>
              <li><span className="bullet rust" /> Reach schools they talk themselves out of</li>
              <li><span className="bullet rust" /> <em>More debt. Worse fit. Less access.</em></li>
            </ul>
            <div className="col-price">
              <span className="mono">what they can afford</span>
              <span className="pix">$0</span>
            </div>
          </div>
        </div>

        <p className="thesis-close serif-ital">
          Nami closes both gaps. A persistent, evidence-backed knowledge
          graph of the student — and the <em>Tsunami</em>, a team of six
          specialists working together to advocate for them. We replicate a
          team with a team.
        </p>
      </div>
    </section>
  );
}
