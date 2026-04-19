/// <reference types="vite/client" />

declare module '*.css';

interface ImportMetaEnv {
  /**
   * Absolute URL of the Nami submarine (/office) in the `web/` Next.js app.
   * Used by `src/lib/routes.ts` to wire marketing-site CTAs to the product.
   * Optional: defaults to `http://localhost:2847/office?demo=maria` in dev
   * and `/office?demo=maria` in prod (assumes host-level rewrites).
   */
  readonly VITE_NAMI_OFFICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
