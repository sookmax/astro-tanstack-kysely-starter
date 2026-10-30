import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext } from "@playwright/test";
import { InsertEntryResultSchema } from "@/lib/schemas/insertEntry.schema";

/** Post an entry as `request`'s user; the body is unique per call. */
export async function createEntry(
  request: APIRequestContext,
  body = `hello ${randomUUID()}`,
) {
  const res = await request.post("/api/entries", { data: { body } });
  expect(res.status()).toBe(201);
  return { id: InsertEntryResultSchema.parse(await res.json()).id, body };
}
