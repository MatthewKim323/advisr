import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Bathysphere palette — kept in sync with :root in globals.css */
        abyss:    "#03121e",
        "abyss-deep": "#010812",
        "abyss-glow": "#0a2a44",
        void:     "#0a1a26",
        hull:     "#142a3d",
        "hull-lit": "#1d3a52",
        rivet:    "#2a4a64",
        brass:    "#e6a559",
        "brass-dim": "#9c6f3b",
        bio:      "#4dd8d3",
        sonar:    "#7cff93",
        coral:    "#ff7557",
        pearl:    "#e8f1ea",
        kelp:     "#5ea687",
      },
      fontFamily: {
        pix:  ["Silkscreen", "ui-monospace", "monospace"],
        hud:  ["VT323", "ui-monospace", "monospace"],
        body: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
