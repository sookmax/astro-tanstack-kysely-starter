// Records the like → sign → read-it-back demo clip (assets/demo-<mode>.gif +
// .mp4) and a still (assets/screenshot-<mode>.png) for the README.
//
//   pnpm demo:record            # both
//   pnpm demo:record mobile     # or: desktop
//
// Needs the dev server (`pnpm dev`, or DEMO_BASE_URL for another local stack)
// and ffmpeg (`brew install ffmpeg`).
//
// Signs up a fresh user through the real better-auth endpoint, so each take
// leaves one `demo-…@example.test` user in the local DB (its entry and like are
// removed afterwards). Never point it at prod.

import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:4321";
const OUT_DIR = import.meta.dirname;
// Playwright records at CSS-pixel size whatever deviceScaleFactor is, so a
// bigger `size` only pads the frame — the viewport IS the video size. Desktop
// stays modest so the GIF does too.
const VIEWPORTS = {
  mobile: { width: 414, height: 800 },
  desktop: { width: 1024, height: 680 },
};
// Skip the SSR loading overlay at the start of the recording.
const TRIM_SECONDS = 1.1;

// A seed entry (src/db/seed/entries_v1.ts) — liked on camera.
const LIKED = "Likes are counted by a Postgres trigger";
const BODY = "Stopped by to say hi — this page was rendered on the server. 👋";

const arg = process.argv[2];
if (arg && !(arg in VIEWPORTS)) {
  throw new Error(
    `unknown mode "${arg}" — use mobile, desktop, or nothing for both`,
  );
}
const modes = arg ? [arg] : Object.keys(VIEWPORTS);

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  throw new Error("ffmpeg not found — brew install ffmpeg");
}

const browser = await chromium.launch();
for (const mode of modes) await record(mode);
await browser.close();

async function record(mode) {
  const { width: W, height: H } = VIEWPORTS[mode];
  const videoDir = mkdtempSync(join(tmpdir(), "guestbook-demo-"));
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    colorScheme: "light",
    recordVideo: { dir: videoDir, size: { width: W, height: H } },
  });

  // Sign in as one API request (like e2e/api/helpers/auth.ts): context.request
  // shares the pages' cookie jar, so the first page load is already authed.
  const signUp = await context.request.post("/api/auth/sign-up/email", {
    data: {
      name: "Ada",
      email: `demo-${randomUUID()}@example.test`,
      password: "correct-horse-battery",
    },
    // better-auth's CSRF check wants an Origin; Playwright sends none
    headers: { origin: BASE },
  });
  if (!signUp.ok()) {
    throw new Error(
      `sign-up failed (${signUp.status()}) — is the dev server up at ${BASE} and the DB migrated?`,
    );
  }

  let mouse = { x: W / 2, y: H - 120 };

  // A visible cursor — headless recordings don't draw one. Also hides Astro's
  // dev toolbar (the TanStack devtools are already off by default; see
  // DevTools.tsx), so takes against `pnpm dev` show only the app.
  await context.addInitScript((start) => {
    addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "astro-dev-toolbar { display: none !important; }";
      document.head.appendChild(style);

      const dot = document.createElement("div");
      dot.id = "demo-cursor";
      Object.assign(dot.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "26px",
        height: "26px",
        marginLeft: "-13px",
        marginTop: "-13px",
        borderRadius: "50%",
        background: "rgba(0,0,0,0.28)",
        border: "2px solid rgba(255,255,255,0.9)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        pointerEvents: "none",
        zIndex: "2147483647",
        transition: "transform 120ms",
        transform: `translate(${start.x}px, ${start.y}px)`,
      });
      document.body.appendChild(dot);
      let { x, y } = start;
      const place = (scale = 1) => {
        dot.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      };
      addEventListener(
        "mousemove",
        (e) => {
          x = e.clientX;
          y = e.clientY;
          place();
        },
        true,
      );
      addEventListener("mousedown", () => place(0.75), true);
      addEventListener("mouseup", () => place(), true);
    });
  }, mouse);

  const page = await context.newPage();

  // Glide the cursor to the element, then press — readable in the clip.
  async function tap(locator) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(mouse.x, mouse.y);
    await page.mouse.move(to.x, to.y, { steps: 25 });
    mouse = to;
    await page.waitForTimeout(250);
    await page.mouse.down();
    await page.waitForTimeout(90);
    await page.mouse.up();
  }

  const entries = () => page.getByTestId("entry");
  const liked = entries().filter({ hasText: LIKED });

  await page.goto("/");
  // the overlay's removal is the hydration signal (src/utils/ssrLoadingIndicator.ts)
  await page.locator("#ssr-loading-indicator").waitFor({ state: "detached" });
  await page.waitForTimeout(1300); // read the list

  // exact: "Like" would also match "Unlike"
  await tap(liked.getByRole("button", { name: "Like", exact: true }));
  await liked.getByRole("button", { name: "Unlike" }).waitFor();
  await page.waitForTimeout(1000); // the optimistic count

  await tap(page.getByRole("link", { name: "New entry" }));
  const textarea = page.getByLabel("Sign the guestbook");
  await textarea.waitFor();
  await tap(textarea);
  await page.keyboard.type(BODY, { delay: 35 });
  await page.waitForTimeout(500);

  await tap(page.getByRole("button", { name: "Post" }));
  await page.waitForURL(/\/entries\/\d+$/);
  const entryId = new URL(page.url()).pathname.split("/").pop();
  await page.waitForTimeout(1300); // the new entry's page

  await tap(page.getByRole("link", { name: "Guestbook" }));
  await entries().first().filter({ hasText: BODY }).waitFor();
  await page.waitForTimeout(1800); // the list, with it on top

  // the still gets no cursor (the clip has already ended above)
  await page.locator("#demo-cursor").evaluate((dot) => dot.remove());
  await page.screenshot({ path: join(OUT_DIR, `screenshot-${mode}.png`) });

  // Undo the take's writes (the page is done, so this isn't on camera).
  const likedId = (await liked.getByRole("link").getAttribute("href"))
    .split("/")
    .pop();
  const headers = { origin: BASE };
  await context.request.delete(`/api/entries/${likedId}/likes`, { headers });
  await context.request.delete(`/api/entries/${entryId}`, { headers });

  const video = page.video();
  await context.close();
  const webm = await video.path();

  const ffmpeg = (...args) =>
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      `${TRIM_SECONDS}`,
      "-i",
      webm,
      ...args,
    ]);
  ffmpeg(
    "-vf",
    "fps=15,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
    "-loop",
    "0",
    join(OUT_DIR, `demo-${mode}.gif`),
  );
  ffmpeg(
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-crf",
    "18",
    join(OUT_DIR, `demo-${mode}.mp4`),
  );
  rmSync(videoDir, { recursive: true, force: true });

  console.log(
    `wrote ${join(OUT_DIR, `demo-${mode}.gif`)}, demo-${mode}.mp4 and screenshot-${mode}.png`,
  );
}
