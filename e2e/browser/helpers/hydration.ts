import { expect, type Page } from "@playwright/test";
import { ssrLoadingIndicator } from "@/utils/ssrLoadingIndicator";

/**
 * Wait until React has hydrated. A direct hit ships a loading overlay in the
 * first paint, and __root's effect removes it once the router mounts — so its
 * absence is the hydration signal (the app's own selector, so the id can't
 * drift). Gate on this before typing into a controlled input: before
 * hydration, React would reset the typed value.
 */
export async function waitForHydration(page: Page) {
  await expect(page.locator(ssrLoadingIndicator.selector())).toHaveCount(0);
}
