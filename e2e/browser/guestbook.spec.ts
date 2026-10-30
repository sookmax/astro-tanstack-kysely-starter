import { randomUUID } from "node:crypto";
import { expect, test } from "./fixtures";
import { waitForHydration } from "./helpers/hydration";
import { createEntry } from "../api/helpers/entries";

test("the home list is server-rendered, then hydrates", async ({ page }) => {
  // a plain HTTP fetch (no JS) proves the HTML itself carries the entries
  const response = await page.request.get("/");
  expect(await response.text()).toContain('data-testid="entry"');

  await page.goto("/");
  await waitForHydration(page);
  await expect(page.getByTestId("entry").first()).toBeVisible();
});

test("client navigation to an entry and back", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);

  const first = page.getByTestId("entry").first();
  const body = await first.locator("p").first().textContent();
  await first.click();

  await expect(page).toHaveURL(/\/entries\/\d+$/);
  await expect(page.getByText(body!)).toBeVisible();

  await page.getByRole("link", { name: "Guestbook" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("an unknown entry renders the 404 page", async ({ page }) => {
  const response = await page.goto("/entries/999999999");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "We couldn't find that page." }),
  ).toBeVisible();
});

test("visitors are sent to sign in from /new and from a like", async ({
  page,
}) => {
  await page.goto("/new");
  await expect(page).toHaveURL("/sign-in?redirect=%2Fnew");
  // let the sign-in page hydrate before navigating away: the router's own
  // initial load would otherwise interrupt the next goto (seen on WebKit)
  await waitForHydration(page);

  await page.goto("/");
  await waitForHydration(page);
  // exact: role names match case-insensitive substrings, so plain "Like" would
  // also match an "Unlike" button
  await page.getByRole("button", { name: "Like", exact: true }).first().click();
  await expect(page).toHaveURL(/\/sign-in\?redirect=%2F$/);
});

test("sign up through the form, then sign out", async ({ page }) => {
  await page.goto("/sign-in?redirect=/me");
  await waitForHydration(page);

  await page
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  await page.getByLabel("Name").fill("Grace");
  await page.getByLabel("Email").fill(`grace-${randomUUID()}@example.test`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();

  await expect(page).toHaveURL("/me");
  await expect(page.getByRole("heading", { name: "My entries" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("post an entry, like it optimistically, delete it", async ({
  authedPage: page,
}) => {
  const body = `browser ${randomUUID()}`;

  await page.goto("/new");
  await waitForHydration(page);
  await page.getByLabel("Sign the guestbook").fill(body);
  await page.getByRole("button", { name: "Post" }).click();

  // lands on the new entry's page
  await expect(page).toHaveURL(/\/entries\/\d+$/);
  const entry = page.getByTestId("entry");
  await expect(entry.getByText(body)).toBeVisible();

  // "Unlike · 1" is the OPTIMISTIC state — it shows before the request lands,
  // so wait for the response too, or the reload below can beat it
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().endsWith("/likes") && res.request().method() === "POST",
    ),
    entry.getByRole("button", { name: "Like", exact: true }).click(),
  ]);
  await expect(entry.getByRole("button", { name: "Unlike" })).toBeVisible();
  await expect(entry.getByTestId("likes-count")).toHaveText("1");

  // the like survives a reload — it reached the server
  await page.reload();
  await expect(
    page.getByTestId("entry").getByRole("button", { name: "Unlike" }),
  ).toBeVisible();

  await waitForHydration(page);
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(body)).toHaveCount(0);
});

test("my entries lists only mine", async ({ authedPage: page }) => {
  const mine = await createEntry(page.request);

  await page.goto("/me");
  await expect(page.getByTestId("entry")).toHaveCount(1);
  await expect(page.getByText(mine.body)).toBeVisible();
});
