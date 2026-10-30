// Not used by Astro (it builds from astro.config.mjs). This is the plain Vite
// config for the two tools that run their own Vite: Storybook
// (@storybook/tanstack-react picks it up) and Vitest.
//
// bare package specifiers resolve via package.json exports, so only relative imports need explicit extensions under Node ESM.
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tsrVitePlugin } from "./tsr.vite.plugin.ts";

export default defineConfig({
  resolve: {
    // `@/*` from tsconfig.json
    tsconfigPaths: true,
  },
  plugins: [
    // must come before @vitejs/plugin-react
    tsrVitePlugin(),
    react(),
    tailwindcss(),
  ],
  test: {
    // Co-located unit specs only; /e2e belongs to Playwright.
    include: ["src/**/*.test.ts"],
  },
});
