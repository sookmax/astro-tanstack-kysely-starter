import { expect, test } from "@playwright/test";
import { ENTRY_BODY_MAX_LENGTH } from "@/constants";
import { EntrySchema } from "@/lib/schemas/entry.schema";
import { GetEntriesResultSchema } from "@/lib/schemas/getEntries.schema";
import { signUp } from "./helpers/auth";
import { createEntry } from "./helpers/entries";

// Responses are parsed with the app's own Zod schemas: one line both types the
// value and fails the test if the API contract drifts.

test.describe("GET /api/entries", () => {
  test("lists entries newest first, marked private", async ({ request }) => {
    const res = await request.get("/api/entries");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toBe("private, no-store");

    const { entries } = GetEntriesResultSchema.parse(await res.json());
    const ids = entries.map((e) => e.id);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });

  test("pages with a keyset cursor, without gaps or repeats", async ({
    request,
  }) => {
    const all = GetEntriesResultSchema.parse(
      await (await request.get("/api/entries?limit=50")).json(),
    ).entries.map((e) => e.id);

    const first = GetEntriesResultSchema.parse(
      await (await request.get("/api/entries?limit=2")).json(),
    );
    expect(first.nextCursor).toBe(first.entries.at(-1)!.id);

    const second = GetEntriesResultSchema.parse(
      await (
        await request.get(`/api/entries?limit=2&cursor=${first.nextCursor}`)
      ).json(),
    );
    // other tests insert concurrently, so compare against ids at or below
    // the first page — the keyset makes that slice stable
    const expected = all.filter((id) => id <= first.entries[0].id).slice(0, 4);
    expect([...first.entries, ...second.entries].map((e) => e.id)).toEqual(
      expected,
    );
  });

  test("rejects a malformed cursor", async ({ request }) => {
    expect((await request.get("/api/entries?cursor=abc")).status()).toBe(400);
  });
});

test.describe("POST /api/entries", () => {
  test("requires sign-in", async ({ request }) => {
    const res = await request.post("/api/entries", { data: { body: "hi" } });
    expect(res.status()).toBe(401);
  });

  test("creates an entry authored by the session user", async ({
    request,
  }) => {
    const user = await signUp(request, "Ada");
    const { id, body } = await createEntry(request);

    const entry = EntrySchema.parse(
      await (await request.get(`/api/entries/${id}`)).json(),
    );
    expect(entry).toMatchObject({
      body,
      likes_count: 0,
      is_author: true,
      is_liked: false,
      author: { id: user.id, name: "Ada" },
    });
  });

  test("validates the body against the shared limit", async ({ request }) => {
    await signUp(request);
    for (const body of ["", "   ", "x".repeat(ENTRY_BODY_MAX_LENGTH + 1)]) {
      const res = await request.post("/api/entries", { data: { body } });
      expect(res.status(), JSON.stringify(body)).toBe(400);
    }
  });
});

test.describe("GET /api/entries/:id", () => {
  test("404s for a missing or malformed id", async ({ request }) => {
    expect((await request.get("/api/entries/999999999")).status()).toBe(404);
    expect((await request.get("/api/entries/abc")).status()).toBe(404);
  });

  test("is_author is per viewer", async ({ request, playwright }) => {
    await signUp(request);
    const { id } = await createEntry(request);

    // a second identity = a fresh context with its own cookie jar
    const visitor = await playwright.request.newContext();
    const entry = EntrySchema.parse(
      await (await visitor.get(`/api/entries/${id}`)).json(),
    );
    expect(entry.is_author).toBe(false);
    await visitor.dispose();
  });
});

test.describe("DELETE /api/entries/:id", () => {
  test("only the author can delete; others get 404", async ({
    request,
    playwright,
  }) => {
    await signUp(request);
    const { id } = await createEntry(request);

    const other = await playwright.request.newContext();
    await signUp(other);
    // bodyless unsafe requests send a JSON content type (Astro's checkOrigin)
    const headers = { "content-type": "application/json" };
    expect(
      (await other.delete(`/api/entries/${id}`, { headers })).status(),
    ).toBe(404);
    await other.dispose();

    expect(
      (await request.delete(`/api/entries/${id}`, { headers })).status(),
    ).toBe(204);
    expect((await request.get(`/api/entries/${id}`)).status()).toBe(404);
  });
});

test.describe("GET /api/me/entries", () => {
  test("requires sign-in", async ({ request }) => {
    expect((await request.get("/api/me/entries")).status()).toBe(401);
  });

  test("lists only the session user's entries", async ({
    request,
    playwright,
  }) => {
    await signUp(request);
    const mine = await createEntry(request);

    const other = await playwright.request.newContext();
    const otherUser = await signUp(other);
    await createEntry(other);
    await other.dispose();

    // identity comes from the session; a query param can't swap it
    const { entries } = GetEntriesResultSchema.parse(
      await (
        await request.get(`/api/me/entries?author_id=${otherUser.id}`)
      ).json(),
    );
    expect(entries.map((e) => e.id)).toEqual([mine.id]);
  });
});
