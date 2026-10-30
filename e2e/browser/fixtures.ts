import { test as base, type Page } from "@playwright/test";
import { signUp } from "../api/helpers/auth";

type Fixtures = {
  /** the fresh user `authedPage` is signed in as */
  user: Awaited<ReturnType<typeof signUp>>;
  /** a page whose context carries that user's session cookie */
  authedPage: Page;
};

// Signing in is one API request, not a UI flow: `context.request` shares its
// cookie jar with the context's pages, so the next navigation is authed. A
// fresh user per test (see signUp). Fixtures are lazy — a test that only
// takes `page` stays a visitor.
export const test = base.extend<Fixtures>({
  user: async ({ context }, use) => {
    await use(await signUp(context.request, "Browser User"));
  },
  authedPage: async ({ page, user: _user }, use) => {
    await use(page);
  },
});

export { expect } from "@playwright/test";
