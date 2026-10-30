import { expect, test } from "@playwright/test";

test("health reports ok and sets no cookie", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.text()).toBe("ok");
  // the middleware skips this path entirely
  expect(res.headers()["set-cookie"]).toBeUndefined();
});
