// @ts-check
// bare package specifiers resolve via package.json exports, so only relative imports need explicit extensions under Node ESM.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import node from "@astrojs/node";
import { tsrVitePlugin } from "./tsr.vite.plugin.ts";

// https://astro.build/config
export default defineConfig({
  output: "server",

  vite: {
    plugins: [tsrVitePlugin(), tailwindcss()],
  },

  integrations: [react()],

  adapter: node({
    mode: "standalone",
  }),
});
