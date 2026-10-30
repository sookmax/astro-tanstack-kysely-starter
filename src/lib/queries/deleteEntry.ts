import "@/utils/server-module";
import { db } from "../db";

// Owner-only by construction: the WHERE matches only the caller's own entry,
// so someone else's id deletes nothing (→ the route answers 404, revealing
// nothing about whether it exists). Likes go with it (ON DELETE CASCADE).
export async function deleteEntry({
  id,
  user_id,
}: {
  id: number;
  user_id: string;
}): Promise<boolean> {
  const result = await db
    .deleteFrom("entries")
    .where("id", "=", id)
    .where("user_id", "=", user_id)
    .executeTakeFirst();

  return result.numDeletedRows > 0n;
}
