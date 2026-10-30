import "@/utils/server-module";
import { sql } from "kysely";
import { db } from "../db";
import type { Entry } from "../schemas/entry.schema";

// The one SELECT behind every entry read (the lists and the detail page), so
// they all return the same shape. `viewer_id` is the signed-in user's id, or
// null for an anonymous visitor — it only drives the per-viewer flags.
export function selectEntries(viewer_id: string | null) {
  return db
    .selectFrom("entries as e")
    .leftJoin("users as u", "u.id", "e.user_id")
    .select((eb) => [
      "e.id",
      "e.body",
      "e.created_at",
      "e.likes_count",
      "e.user_id",
      "u.name as author_name",
      "u.image as author_image",
      viewer_id === null
        ? sql<boolean>`false`.as("is_liked")
        : eb
            .exists(
              eb
                .selectFrom("entry_likes as l")
                .whereRef("l.entry_id", "=", "e.id")
                .where("l.user_id", "=", viewer_id),
            )
            .as("is_liked"),
    ]);
}

type EntryRow = Awaited<
  ReturnType<ReturnType<typeof selectEntries>["executeTakeFirstOrThrow"]>
>;

// Row → wire shape: the flat join columns become a nested `author` (null for a
// seed entry), and `is_author` is decided here, server-side, from the session.
// The author's user id IS on the wire (`author.id`) — an opaque public id, not
// a credential; nothing that authorizes a request ever comes from the client.
export function toEntry(row: EntryRow, viewer_id: string | null): Entry {
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    likes_count: row.likes_count,
    author:
      row.user_id !== null && row.author_name !== null
        ? { id: row.user_id, name: row.author_name, image: row.author_image }
        : null,
    // `exists()` types as SqlBool (boolean | 0 | 1) — coerce at the boundary
    is_liked: Boolean(row.is_liked),
    is_author: viewer_id !== null && row.user_id === viewer_id,
  };
}
