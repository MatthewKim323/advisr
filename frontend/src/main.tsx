import {StrictMode, type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';

/**
 * Path-based routing.
 *   /       → CritiquePage (main / production)
 *   /leo    → Leo's original App (preserved as A/B backup)
 *
 * Each route dynamically imports its own CSS so styles never collide.
 * Vercel/Vite fall back to index.html for unknown paths.
 */
const root = createRoot(document.getElementById('root')!);
const path = window.location.pathname;
const isLeo = path === '/leo' || path.startsWith('/leo/');

if (isLeo) {
  void Promise.all([import('./App'), import('./index.css')]).then(([mod]) => {
    const App = mod.default;
    root.render(
      <StrictMode>
        <ABOverlay />
        <App />
      </StrictMode>,
    );
  });
} else {
  void Promise.all([import('./critique/CritiquePage'), import('./critique/critique.css')]).then(
    ([mod]) => {
      const CritiquePage = mod.default;
      root.render(
        <StrictMode>
          <CritiquePage />
        </StrictMode>,
      );
    },
  );
}

/**
 * Floating A/B toggle overlaid on Leo's backup route. Critique route
 * has its own toggle baked into CritiquePage matching that aesthetic.
 */
function ABOverlay() {
  const style: CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 500,
    display: 'flex',
    gap: 2,
    padding: 4,
    background: 'rgba(8, 14, 26, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 2,
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
  };
  const link: CSSProperties = {
    padding: '8px 14px',
    borderRadius: 2,
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
  };
  const active: CSSProperties = {
    ...link,
    background: 'rgba(255,255,255,0.14)',
    color: '#fff',
  };
  return (
    <div style={style} role="navigation" aria-label="A/B toggle">
      <a href="/leo" style={active}>
        leo
      </a>
      <a href="/" style={link}>
        nami
      </a>
    </div>
  );
}
