import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext } from "@playwright/test";
import { UserSchema, type User } from "@/lib/schemas/user.schema";

export const TEST_PASSWORD = "correct-horse-battery";

/**
 * Sign `request` up as a FRESH user through better-auth's real email sign-up
 * endpoint. better-auth signs the new user in, so the session cookie lands in
 * this context's jar and its later requests are authed.
 *
 * A new user per call, never a shared one: under fullyParallel, a shared
 * identity would let tests trample each other's state ("my entries", likes).
 * Works for browser tests too — `page.request` shares the page's cookie jar.
 */
export async function signUp(request: APIRequestContext, name = "Test User") {
  const email = `test-${randomUUID()}@example.test`;

  const res = await request.post("/api/auth/sign-up/email", {
    data: { name, email, password: TEST_PASSWORD },
    // better-auth's CSRF check wants an Origin (Playwright sends none); the
    // base URL's host is one of auth-server.ts's allowedHosts.
    headers: { origin: baseURL() },
  });
  expect(res.ok(), `sign-up failed: ${res.status()}`).toBeTruthy();

  const { user } = (await res.json()) as { user: User };
  return { ...UserSchema.parse(user), email };
}

function baseURL() {
  return process.env.E2E_BASE_URL ?? "http://localhost:4400";
}
