import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a1311",
        paper: "#f1e4c5",
        lamp: "#f4b94a",
        rust: "#c25a3e",
        teal: "#4f8d89",
        plum: "#6b4a7c",
      },
      fontFamily: {
        pix: ["Silkscreen", "monospace"],
        serif: ["Instrument Serif", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
