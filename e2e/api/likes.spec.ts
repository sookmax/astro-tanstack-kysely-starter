import { expect, test } from "@playwright/test";
import { LikeEntryResultSchema } from "@/lib/schemas/likeEntry.schema";
import { EntrySchema } from "@/lib/schemas/entry.schema";
import { signUp } from "./helpers/auth";
import { createEntry } from "./helpers/entries";

const headers = { "content-type": "application/json" };

test("liking requires sign-in", async ({ request }) => {
  const res = await request.post("/api/entries/1/likes", { headers });
  expect(res.status()).toBe(401);
});

test("like and unlike are idempotent; the trigger keeps the count", async ({
  request,
  playwright,
}) => {
  await signUp(request);
  const { id } = await createEntry(request);
  const like = async () =>
    LikeEntryResultSchema.parse(
      await (await request.post(`/api/entries/${id}/likes`, { headers })).json(),
    );
  const unlike = async () =>
    LikeEntryResultSchema.parse(
      await (
        await request.delete(`/api/entries/${id}/likes`, { headers })
      ).json(),
    );

  expect(await like()).toEqual({ entry_id: id, likes_count: 1, is_liked: true });
  // a double tap doesn't double-count
  expect(await like()).toMatchObject({ likes_count: 1 });

  // another user's like adds to the shared count
  const other = await playwright.request.newContext();
  await signUp(other);
  await other.post(`/api/entries/${id}/likes`, { headers });

  const asOther = EntrySchema.parse(
    await (await other.get(`/api/entries/${id}`)).json(),
  );
  expect(asOther).toMatchObject({ likes_count: 2, is_liked: true });
  await other.dispose();

  expect(await unlike()).toEqual({
    entry_id: id,
    likes_count: 1,
    is_liked: false,
  });
  expect(await unlike()).toMatchObject({ likes_count: 1 });
});

test("liking a missing entry is a 404", async ({ request }) => {
  await signUp(request);
  for (const method of ["post", "delete"] as const) {
    const res = await request[method]("/api/entries/999999999/likes", {
      headers,
    });
    expect(res.status(), method).toBe(404);
  }
});
