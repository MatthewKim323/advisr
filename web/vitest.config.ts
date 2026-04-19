import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["tests/e2e/**"],
    globals: false,
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@agents": path.resolve(__dirname, "lib/agents"),
      "@graph": path.resolve(__dirname, "lib/graph"),
      "server-only": path.resolve(__dirname, "tests/_shims/server-only.ts"),
    },
  },
});
