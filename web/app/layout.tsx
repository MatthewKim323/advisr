import type { Metadata } from "next";
import { Syne_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nami // Bathysphere-7",
  description:
    "A pixel-art AI counseling submarine crewed by the Tsunami — a six-specialist team that gives every student what rich kids hire for $50,000.",
};

// Syne Mono — the ASCII dive loader on `/`. Loaded via next/font so the
// font-face is inlined with the HTML and there's no render-blocking
// stylesheet round-trip for the first frame of the boot sequence.
const syneMono = Syne_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={syneMono.variable}>
      <head>
        {/*
          Landing page typography — SSR'd so the critique page never
          flashes Times New Roman before the runtime link injector fires.
            · PP Mondwest (same-origin, see critique.css @font-face) for
              every pixel-serif headline.
            · Barlow → body copy (--f-body).
            · Instrument Serif → accent quotes + crew labels (--f-accent).
            · Newsreader → fallback display face behind Mondwest.
            · JetBrains Mono → meta / coordinates / chips (--f-mono).
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/ppmondwest-regular.woff2"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
