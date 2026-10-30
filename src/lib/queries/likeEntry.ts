import "@/utils/server-module";
import { entryLikes } from "@/db/schemas/entryLikes";
import { EntryNotFoundError } from "@/utils/error";
import { db } from "../db";
import type { LikeEntryResult } from "../schemas/likeEntry.schema";

type Params = { entry_id: number; user_id: string };

// Both directions are idempotent — liking twice or unliking a not-liked entry
// is a no-op, never an error. The trigger has already moved `likes_count` by
// the time we read it back.

export async function likeEntry({
  entry_id,
  user_id,
}: Params): Promise<LikeEntryResult> {
  try {
    await db
      .insertInto("entry_likes")
      .values({ entry_id, user_id })
      .onConflict((oc) => oc.constraint(entryLikes.one_like_per_user).doNothing())
      .execute();
  } catch (error) {
    // a missing entry trips the FK — that's the existence check, for free
    if (entryLikes.isMissingEntryError(error)) throw EntryNotFoundError;
    throw error;
  }

  return { entry_id, likes_count: await readLikesCount(entry_id), is_liked: true };
}

export async function unlikeEntry({
  entry_id,
  user_id,
}: Params): Promise<LikeEntryResult> {
  await db
    .deleteFrom("entry_likes")
    .where("entry_id", "=", entry_id)
    .where("user_id", "=", user_id)
    .execute();

  // A DELETE that matches nothing is silent, so here the read-back doubles as
  // the existence check (and it must run after the DELETE to see the new count).
  return {
    entry_id,
    likes_count: await readLikesCount(entry_id),
    is_liked: false,
  };
}

async function readLikesCount(entry_id: number) {
  const row = await db
    .selectFrom("entries")
    .select("likes_count")
    .where("id", "=", entry_id)
    .executeTakeFirst();

  if (!row) throw EntryNotFoundError;
  return row.likes_count;
}
