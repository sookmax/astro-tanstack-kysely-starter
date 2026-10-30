import { defineConfig, devices } from "@playwright/test";

// Runs against the compose test stack (the production image on :4400 —
// `pnpm e2e:up`), or against `pnpm dev` with E2E_BASE_URL=http://localhost:4321
// (`pnpm test:e2e:dev`).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:4400";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    // API contract tier: Playwright's `request` fixture only, no browser.
    { name: "api", testDir: "./e2e/api" },

    // Browser tier: the same specs on two engines; the device descriptor is
    // the only difference. `mobile-safari` is WebKit + an iPhone viewport, not
    // real iOS Safari.
    {
      name: "chromium",
      testDir: "./e2e/browser",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      testDir: "./e2e/browser",
      use: { ...devices["iPhone 15"] },
    },
  ],
  // Reused when already up; otherwise builds the image and boots the stack.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm e2e:up",
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 600_000,
      },
});
