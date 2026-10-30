import "@/utils/server-module";
import { db } from "../db";
import type {
  InsertEntryBody,
  InsertEntryResult,
} from "../schemas/insertEntry.schema";

// Returns only the new id: the client invalidates the lists and refetches, so
// re-selecting the full entry here would be fetched and thrown away.
export async function insertEntry({
  body,
  user_id,
}: InsertEntryBody & { user_id: string }): Promise<InsertEntryResult> {
  return db
    .insertInto("entries")
    .values({ body, user_id })
    .returning("id")
    .executeTakeFirstOrThrow();
}
