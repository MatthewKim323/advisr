import {useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject} from 'react';
import {motion, useMotionValue, useScroll, useSpring, useTransform} from 'motion/react';
import {diveToOffice} from '../lib/routes';

/**
 * CritiquePage — ported from
 *   ~/.gstack/projects/MatthewKim323-advisr/designs/landing-critique-20260419/finalized.html
 *
 * A/B with Leo's landing page:
 *   /          → App (Leo's draft)
 *   /critique  → this page (tightened polish pass)
 *
 * Motion layer is all on-theme submarine stuff:
 *   - rising bubbles + periscope scanline in hero
 *   - cursor-tracked vignette on hero video
 *   - fixed-left depth gauge tracking scroll as fathoms
 *   - motion-spring tilt on crew cards (TiltedCrewCard)
 *   - per-letter ride-in on the log mega-type
 *   - stroke draw-on for crew icons + seafloor chart path
 *   - glitch flicker on "No map detected"
 *   - shimmer wash on logo + arch-close line
 *   - sonar ping rings on status dot + agent chips
 *   - infinite partner marquee in hero
 *
 * All motion is gated by `prefers-reduced-motion` in critique.css.
 */

// CSS custom-property helper — TS complains about unknown --keys on style, so cast once.
const cssVars = (vars: Record<string, string | number>): CSSProperties =>
  vars as unknown as CSSProperties;

function splitLetters(text: string, startIndex = 0) {
  // per-letter spans with --i index for CSS stagger; preserve spaces as nbsp
  return [...text].map((ch, i) => (
    <span key={i} className="letter" style={cssVars({'--i': String(i + startIndex)})}>
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ));
}

/**
 * TiltedCrewCard — motion-spring driven 3D tilt for crew cards.
 * Replaces the raw mousemove CSS-var approach with useSpring for
 * smooth overshoot feel. `className` is appended so callers can pass
 * "crew-wide" for the grid-column-span variant.
 */
function TiltedCrewCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useMotionValue(0), {damping: 22, stiffness: 180, mass: 0.8});
  const ry = useSpring(useMotionValue(0), {damping: 22, stiffness: 180, mass: 0.8});

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    mx.set((dx / r.width) * 100);
    my.set((dy / r.height) * 100);
    const nx = (dx / r.width - 0.5) * 2;
    const ny = (dy / r.height - 0.5) * 2;
    rx.set(ny * -9);
    ry.set(nx * 12);
    ref.current.style.setProperty('--tc-mx', `${(dx / r.width) * 100}%`);
    ref.current.style.setProperty('--tc-my', `${(dy / r.height) * 100}%`);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <article
      ref={ref as unknown as RefObject<HTMLElement>}
      className={`crew-card reveal ${className ?? ''}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <figure className="tc-figure">
        <motion.div
          className="tc-inner"
          style={{rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d'}}
        >
          {children}
          <div className="tc-glare" aria-hidden="true" />
        </motion.div>
      </figure>
    </article>
  );
}

/**
 * LogoMarquee — infinite horizontal scroller for partner / agent names.
 * Items are duplicated so a -50% translate in CSS loops seamlessly.
 */
function LogoMarquee({items}: {items: string[]}) {
  const doubled = [...items, ...items];
  return (
    <div className="logo-marquee" aria-label="Partner agents">
      <div className="logo-marquee-track">
        {doubled.map((name, i) => (
          <span key={`${name}-${i}`} className="logo-marquee-item">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * SectionStage — scroll-staged wrapper, stolen and remixed from the iris studio.
 * Every content section gets: beam-in hairline at top, soft radial halo,
 * ghost section number, mono section chip, and scroll-linked opacity/y/scale.
 * Pure atmosphere — zero layout impact.
 */
function SectionStage({
  id,
  n,
  chip,
  className,
  children,
}: {
  id: string;
  n: string;
  chip: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start 92%', 'end 8%'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.82, 1], [0.4, 1, 1, 0.55]);
  const y = useTransform(scrollYProgress, [0, 0.24], [56, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.24, 0.82, 1], [0.985, 1, 1, 0.995]);
  const beamScaleX = useTransform(scrollYProgress, [0, 0.28], [0.2, 1]);
  const beamOpacity = useTransform(scrollYProgress, [0, 0.18, 0.55, 0.92], [0, 1, 0.42, 0]);
  const haloOpacity = useTransform(scrollYProgress, [0, 0.25, 0.65, 1], [0, 0.22, 0.08, 0]);
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.22, 0.78, 1], [0, 0.26, 0.26, 0]);
  const ghostY = useTransform(scrollYProgress, [0, 0.3], [24, 0]);

  return (
    <motion.section
      ref={ref as unknown as RefObject<HTMLElement>}
      id={id}
      className={`${className ?? ''} stage`}
      style={{opacity, y, scale}}
    >
      <motion.div
        className="stage-beam"
        style={{scaleX: beamScaleX, opacity: beamOpacity}}
        aria-hidden="true"
      />
      <motion.div className="stage-halo" style={{opacity: haloOpacity}} aria-hidden="true" />
      <motion.span
        className="stage-ghost"
        style={{opacity: ghostOpacity, y: ghostY}}
        aria-hidden="true"
      >
        {n}
      </motion.span>
      <span className="stage-chip" aria-hidden="true">
        <span className="stage-chip-dot" />
        © nami — {n} / {chip}
      </span>
      {children}
    </motion.section>
  );
}

function SectionDivider() {
  return <div className="stage-divider" aria-hidden="true" />;
}

function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />;
}

export default function CritiquePage() {
  const navRef = useRef<HTMLElement | null>(null);
  const gaugeFillRef = useRef<HTMLDivElement | null>(null);
  const gaugeRef = useRef<HTMLDivElement | null>(null);
  const gaugeLabelRef = useRef<HTMLSpanElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroCursorRef = useRef<HTMLDivElement | null>(null);

  // auto-cycling log step highlight — stolen from iris's Thesis auto-advance
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setActiveStep((i) => (i + 1) % 3), 3400);
    return () => window.clearInterval(id);
  }, []);

  // pre-compute bubble props so they're stable across renders
  const bubbles = useMemo(() => {
    return Array.from({length: 18}, (_, i) => ({
      x: `${(i * 7.3 + 5) % 96}%`,
      sz: 4 + ((i * 37) % 10),
      dur: 10 + ((i * 13) % 14),
      dly: -(i * 0.8) % 12,
      drift: ((i % 2 === 0 ? 1 : -1) * (8 + (i * 11) % 22)),
    }));
  }, []);

  useEffect(() => {
    document.title = 'nami — college navigation for first-gen students';

    // preload Google Fonts for this route (injected once; dedup by id)
    const fontId = 'critique-fonts';
    if (!document.getElementById(fontId)) {
      const pre1 = document.createElement('link');
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      pre1.id = fontId;
      document.head.appendChild(pre1);

      const pre2 = document.createElement('link');
      pre2.rel = 'preconnect';
      pre2.href = 'https://fonts.gstatic.com';
      pre2.crossOrigin = '';
      document.head.appendChild(pre2);

      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href =
        'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap';
      document.head.appendChild(font);
    }

    const nav = navRef.current;
    const gauge = gaugeRef.current;
    const gaugeFill = gaugeFillRef.current;
    const gaugeLabel = gaugeLabelRef.current;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, y / max));

        if (nav) nav.classList.toggle('is-scrolled', y > 50);

        if (gauge) gauge.classList.toggle('is-visible', y > 240);
        if (gaugeFill) gaugeFill.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
        if (gaugeLabel) {
          // 0 → 2400 fathoms mapped to scroll progress
          const fathoms = Math.round(p * 2400);
          gaugeLabel.textContent = `${String(fathoms).padStart(4, '0')}\u00A0fm`;
        }

        ticking = false;
      });
      ticking = true;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      {rootMargin: '-80px 0px'},
    );
    document.querySelectorAll('.critique-root .reveal').forEach((el) => io.observe(el));

    // crew-card mousemove is handled by TiltedCrewCard internally now

    // final-cta magnetic pull
    const cta = document.querySelector<HTMLButtonElement>('.critique-root .cta-final-btn');
    const ctaCleanups: Array<() => void> = [];
    if (cta) {
      // 160px pull radius
      const onWindowMove = (ev: MouseEvent | Event) => {
        const e = ev as unknown as {clientX: number; clientY: number};
        const r = cta.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const max = 160;
        if (dist < max) {
          const strength = 1 - dist / max;
          cta.style.setProperty('--tx', (Math.sign(dx) * Math.min(1, Math.abs(dx) / max) * strength).toFixed(3));
          cta.style.setProperty('--ty', (Math.sign(dy) * Math.min(1, Math.abs(dy) / max) * strength).toFixed(3));
        } else {
          cta.style.setProperty('--tx', '0');
          cta.style.setProperty('--ty', '0');
        }
      };
      window.addEventListener('mousemove', onWindowMove as (e: Event) => void);
      ctaCleanups.push(() =>
        window.removeEventListener('mousemove', onWindowMove as (e: Event) => void),
      );
    }

    // hero cursor-vignette
    const hero = heroRef.current;
    const heroCursor = heroCursorRef.current;
    let onHeroMove: ((e: Event) => void) | null = null;
    let onHeroLeave: (() => void) | null = null;
    if (hero && heroCursor) {
      onHeroMove = (ev) => {
        const e = ev as unknown as {clientX: number; clientY: number};
        const r = hero.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        heroCursor.style.setProperty('--mx', `${mx}%`);
        heroCursor.style.setProperty('--my', `${my}%`);
        heroCursor.style.opacity = '1';
      };
      onHeroLeave = () => {
        heroCursor.style.opacity = '0';
      };
      hero.addEventListener('mousemove', onHeroMove);
      hero.addEventListener('mouseleave', onHeroLeave);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      ctaCleanups.forEach((fn) => fn());
      if (hero && onHeroMove) hero.removeEventListener('mousemove', onHeroMove);
      if (hero && onHeroLeave) hero.removeEventListener('mouseleave', onHeroLeave);
    };
  }, []);

  const onAnchor = (e: MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href') ?? '';
    if (!href.startsWith('#')) return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({top: y, behavior: 'smooth'});
  };

  // partner / agent names for the hero marquee (lowercase wordmarks)
  const partners = [
    'archivist',
    'dean',
    'match-maker',
    'draft',
    'scout',
    'bursar',
    'timekeeper',
    'navigator',
    'pilot',
  ];

  return (
    <div className="critique-root">
      {/* film-grain overlay — fixed across viewport */}
      <NoiseOverlay />

      {/* fixed depth gauge — scroll-linked "fathoms" readout */}
      <div className="depth-gauge" ref={gaugeRef} aria-hidden="true">
        <span className="depth-gauge-label">Depth</span>
        <div className="depth-gauge-track">
          <span className="depth-gauge-tick" />
          <span className="depth-gauge-tick" />
          <span className="depth-gauge-tick" />
          <span className="depth-gauge-tick" />
          <span className="depth-gauge-tick" />
          <div className="depth-gauge-fill" ref={gaugeFillRef} />
        </div>
        <span className="depth-gauge-label" ref={gaugeLabelRef}>
          0000&nbsp;fm
        </span>
      </div>

      {/* nav */}
      <div className="nav-wrap">
        <nav className="nav" id="site-nav" aria-label="Primary" ref={navRef}>
          <div className="nav-left">
            <a href="#top" className="logo" onClick={onAnchor}>
              nami
            </a>
            <div className="nav-links">
              <a href="#gap" onClick={onAnchor}>
                mission
              </a>
              <a href="#gap" onClick={onAnchor}>
                the gap
              </a>
              <a href="#crew" onClick={onAnchor}>
                the crew
              </a>
              <a href="#log" onClick={onAnchor}>
                log
              </a>
              <a href="#arch" onClick={onAnchor}>
                architecture
              </a>
            </div>
          </div>
          <div>
            <button
              className="liquid-glass nav-cta"
              type="button"
              onClick={diveToOffice}
              aria-label="Begin dive — enter the Nami submarine"
            >
              begin dive
            </button>
          </div>
        </nav>
      </div>

      {/* hero */}
      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-bg">
          <video autoPlay loop muted playsInline poster="">
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_3CZPMI9yqo0e85uJdS7tB0FcKsC/hf_20260419_164352_85e5afad-cee1-486c-99ec-0140a80bc9fe.mp4"
              type="video/mp4"
            />
          </video>
          <div
            className="hero-bg-fallback"
            aria-hidden="true"
            style={{position: 'absolute', inset: 0, zIndex: -1}}
          />
        </div>

        {/* ambient bubbles rising through the hero */}
        <div className="bubbles" aria-hidden="true">
          {bubbles.map((b, i) => (
            <span
              key={i}
              className="bubble"
              style={cssVars({
                '--x': b.x,
                '--sz': `${b.sz}px`,
                '--dur': `${b.dur}s`,
                '--dly': `${b.dly}s`,
                '--drift': `${b.drift}px`,
              })}
            />
          ))}
        </div>

        {/* cursor-tracked vignette */}
        <div className="hero-cursor" ref={heroCursorRef} aria-hidden="true" />

        {/* periscope scanline sweeping down */}
        <div className="hero-scan" aria-hidden="true" />

        <div className="hero-scrim-1" />
        <div className="hero-scrim-2" />
        <div className="hero-scrim-top" />
        <div className="hero-scrim-bot" />

        <div className="hero-content">
          <div className="hero-inner">
            <h2 className="hero-headline">
              <span className="line">
                <span style={cssVars({'--delay': '0.05s'})}>Lost</span>
                <span style={cssVars({'--delay': '0.15s'})}> in the</span>
                <span className="chrome-text" style={cssVars({'--delay': '0.25s'})}> deep?</span>
              </span>
              <span className="line">
                <span style={cssVars({'--delay': '0.45s'})}>We</span>
                <span style={cssVars({'--delay': '0.55s'})}> built</span>
                <span style={cssVars({'--delay': '0.65s'})}> your</span>
                <span className="chrome-text" style={cssVars({'--delay': '0.75s'})}> crew.</span>
              </span>
            </h2>

            <p className="hero-sub">
              The college process wasn't built for you. Nami gives you seven specialists who know
              who you are, know the landscape, and put you in the driver's seat of getting to
              shore.
            </p>

            <div className="hero-ctas">
              <button className="liquid-glass btn-primary" type="button">
                Pilot your submarine
                <span className="btn-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
              <button className="btn-ghost" type="button">
                Meet the crew
              </button>
            </div>
          </div>
        </div>

        <footer className="partners-bar">
          <div className="partners-inner">
            <div className="crew-status">
              <span className="crew-dot" aria-hidden="true" />
              your crew — 7 agents online
            </div>
            <LogoMarquee items={partners} />
          </div>
        </footer>
      </section>

      <SectionDivider />

      {/* section 2 — the gap */}
      <SectionStage id="gap" n="01" chip="the gap" className="gap-section">
        <div className="container">
          <div className="gap-grid">
            <div className="gap-copy reveal">
              <h2 className="chrome-text">The college process assumes a lot.</h2>
              <p>
                Only 1 in 8 low-income students ever gets college counseling. The process assumes
                you have time, context, and someone to call when you're confused. Most students
                don't. And the real barrier isn't just missing information — it's the stress and
                overwhelm that make it hard to even begin.
              </p>
              <div className="gap-tag">
                <div className="hairline" />
                <span>You don't need more information. You need a team.</span>
              </div>
            </div>

            <div className="gap-split reveal">
              <div className="gap-cell is-assumed">
                <div>
                  <span className="gap-cell-label">What the process assumes you have</span>
                  <ul>
                    <li>Someone who has navigated this before</li>
                    <li>Time to research every option</li>
                    <li>Confidence that this is meant for you</li>
                  </ul>
                </div>
                <div className="gap-signal ok">
                  <span className="dot" />
                  <span>Stable signal</span>
                </div>
              </div>
              <div className="gap-cell is-real">
                <div>
                  <span className="gap-cell-label">What it actually feels like</span>
                  <ul>
                    <li>Starting from zero with no map</li>
                    <li>Too overwhelmed to know where to begin</li>
                    <li>A process that wasn't designed for your life</li>
                  </ul>
                </div>
                <div className="gap-signal err">
                  <span className="dot" />
                  <span data-glitch="No map detected">No map detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionStage>

      <SectionDivider />

      {/* section 3 — the crew */}
      <SectionStage id="crew" n="02" chip="the crew" className="crew-section">
        <div className="container">
          <div className="crew-header reveal">
            <h2 className="chrome-text">Your crew. Seven specialists. Zero dollars.</h2>
            <span className="sub">Crew status — all stations operational</span>
          </div>
        </div>
        <div className="crew-grid">
          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Dean</h3>
              <p className="crew-desc">
                Orchestrates your entire trajectory from departure to shore. The captain of your
                crew.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="crew-role">Head counselor</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Archivist</h3>
              <p className="crew-desc">
                Builds your profile. Synthesizes your life into an ocean-ready digital dossier.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14a9 3 0 0 0 18 0V5" />
                <path d="M3 12a9 3 0 0 0 18 0" />
              </svg>
              <span className="crew-role">Profile builder</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Match-Maker</h3>
              <p className="crew-desc">
                Finds schools you can actually afford. Mathematical filters applied to your
                academic potential.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span className="crew-role">Financial match</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Draft</h3>
              <p className="crew-desc">
                Reads and improves your essays. Linguistic optimization for maximum impact.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              <span className="crew-role">Essay analyst</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Scout</h3>
              <p className="crew-desc">
                Finds scholarships you qualify for. Deep-search strategies across the aid
                landscape.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="crew-role">Grant finder</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard>
            <div>
              <h3 className="crew-name">Bursar</h3>
              <p className="crew-desc">
                Shows your real cost after aid. Pure economic data, stripped of obfuscation.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
                <path d="M12 6v2m0 8v2" />
              </svg>
              <span className="crew-role">Cost analysis</span>
            </div>
          </TiltedCrewCard>

          <TiltedCrewCard className="crew-wide">
            <div>
              <h3 className="crew-name">Timekeeper</h3>
              <p className="crew-desc" style={{maxWidth: 620}}>
                Builds your deadline calendar. Temporal mapping of admission-critical milestones.
                Never miss a deadline.
              </p>
            </div>
            <div className="crew-meta">
              <svg
                className="crew-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="crew-role">Deadline scheduler</span>
            </div>
          </TiltedCrewCard>
        </div>
      </SectionStage>

      <SectionDivider />

      {/* section 5 — from lost to landed */}
      <SectionStage id="log" n="04" chip="navigation log" className="log-section">
        <div className="container">
          <div className="log-inner reveal">
            <span className="log-kicker">Navigation log</span>
            <h2 className="log-mega">
              <span className="mega-line">{splitLetters('From lost', 0)}</span>
              <span className="mega-line">{splitLetters('to landed.', 0)}</span>
            </h2>
            <div className="log-steps">
              <div className={`log-step${activeStep === 0 ? ' is-active' : ''}`}>
                <div className="log-step-head">
                  <span className="log-step-num">01</span>
                  <span className="log-step-title">Drop your context.</span>
                </div>
                <p className="log-step-body">
                  Your transcript, essays, financial info. Archivist reads all of it and builds
                  your profile.
                </p>
              </div>
              <div className={`log-step${activeStep === 1 ? ' is-active' : ''}`}>
                <div className="log-step-head">
                  <span className="log-step-num">02</span>
                  <span className="log-step-title">Talk to Dean.</span>
                </div>
                <p className="log-step-body">
                  Your head counselor learns what you need and puts the crew to work in real time.
                </p>
              </div>
              <div className={`log-step${activeStep === 2 ? ' is-active' : ''}`}>
                <div className="log-step-head">
                  <span className="log-step-num">03</span>
                  <span className="log-step-title">Get your plan.</span>
                </div>
                <p className="log-step-body">
                  A school list, matched scholarships, essay feedback, your real aid picture, and a
                  deadline calendar built for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionStage>

      <SectionDivider />

      {/* section 6 — architecture */}
      <SectionStage id="arch" n="05" chip="architecture" className="arch-section">
        <div className="container">
          <div className="arch-grid">
            <div className="arch-lead reveal">
              <h2 className="chrome-text">Built because the gap is real.</h2>
              <p>
                Nami was built for the student who is juggling two jobs, taking care of her family,
                and trying to navigate a process that assumes she has time, context, and someone to
                call. The college counseling gap is not an information problem. It is a team
                problem. We built the team.
              </p>
            </div>
            <div className="arch-detail reveal">
              <h3>The architecture.</h3>
              <p>
                Nami runs on two kinds of memory. A Student Graph that knows who you are — built
                from everything you upload, stored as structured claims every agent can query. And
                a World Corpus powered by Human Delta that knows the landscape — pre-indexed
                schools, scholarships, aid policies, and essay resources. Seven Claude agents sit
                at the intersection of both, synthesizing personal knowledge and world knowledge
                into guidance specific to you.
              </p>
              <div className="arch-chips">
                <div className="chip-cluster">
                  {Array.from({length: 7}, (_, i) => (
                    <span
                      key={i}
                      className="chip"
                      style={cssVars({'--ci': String(i)})}
                    />
                  ))}
                </div>
                <span className="arch-chip-label">7 agent sub-cluster active</span>
              </div>
            </div>
          </div>

          <div className="arch-close reveal">
            <span className="arch-close-line">Two memories. Seven specialists. One student.</span>
          </div>
        </div>
      </SectionStage>

      <SectionDivider />

      {/* section 7 — final CTA with CSS depth-sounding chart */}
      <SectionStage id="dive" n="06" chip="begin dive" className="final-cta">
        <div className="depth-chart reveal" aria-hidden="true">
          <span className="label-corner label-tl mono">Depth · Sounding 001</span>
          <span className="label-corner label-tr mono">28° 13' N · 142° 47' W</span>
          <span className="label-corner label-br mono">Fathoms · 2400</span>
          <svg viewBox="0 0 1200 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
              <line x1="0" y1="80" x2="1200" y2="80" />
              <line x1="0" y1="160" x2="1200" y2="160" />
              <line x1="0" y1="240" x2="1200" y2="240" />
              <line x1="0" y1="320" x2="1200" y2="320" />
              <line x1="200" y1="0" x2="200" y2="400" />
              <line x1="400" y1="0" x2="400" y2="400" />
              <line x1="600" y1="0" x2="600" y2="400" />
              <line x1="800" y1="0" x2="800" y2="400" />
              <line x1="1000" y1="0" x2="1000" y2="400" />
            </g>
            <line
              x1="0"
              y1="120"
              x2="1200"
              y2="120"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              d="M0,140 L40,155 L90,180 L150,225 L220,310 L300,350 L380,345 L460,330 L540,360 L620,378 L710,372 L790,340 L880,310 L970,295 L1060,310 L1150,330 L1200,340 L1200,400 L0,400 Z"
              fill="rgba(16,185,129,0.08)"
              stroke="rgba(16,185,129,0.55)"
              strokeWidth="1.2"
            />
            <circle cx="540" cy="360" r="4" fill="#10B981" />
            <circle
              cx="540"
              cy="360"
              r="10"
              fill="none"
              stroke="rgba(16,185,129,0.6)"
              strokeWidth="1"
            >
              <animate attributeName="r" from="10" to="36" dur="2s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                from="0.6"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x="12"
              y="76"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              0
            </text>
            <text
              x="12"
              y="156"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              800
            </text>
            <text
              x="12"
              y="236"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              1600
            </text>
            <text
              x="12"
              y="316"
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              2400
            </text>
          </svg>
        </div>
        <button
          className="liquid-glass-strong cta-final-btn"
          type="button"
          onClick={diveToOffice}
          aria-label="Your crew is ready — board the submarine"
        >
          Your crew is ready
        </button>
      </SectionStage>

      {/* footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-logo">nami</div>
          <div className="footer-links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>X / Insta</span>
          </div>
          <div className="footer-copy">© 2026 nami systems</div>
        </div>
      </footer>
    </div>
  );
}
