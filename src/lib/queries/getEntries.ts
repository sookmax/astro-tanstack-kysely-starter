import "@/utils/server-module";
import { ENTRIES_PAGE_SIZE } from "../schemas/getEntries.schema";
import type { GetEntriesResult } from "../schemas/getEntries.schema";
import { selectEntries, toEntry } from "./selectEntries";

export type GetEntriesParams = {
  viewer_id: string | null;
  // set → only this author's entries (the /me list)
  author_id?: string;
  cursor?: number | null;
  limit?: number;
};

// Newest first, keyset-paginated on the serial id: "the page after `cursor`"
// is `id < cursor`, which stays correct while new entries arrive (an OFFSET
// would shift). `cursor = null` by default and compared strictly — an
// `undefined` slipping into `id < undefined` would return an empty page.
export async function getEntries({
  viewer_id,
  author_id,
  cursor = null,
  limit = ENTRIES_PAGE_SIZE,
}: GetEntriesParams): Promise<GetEntriesResult> {
  const rows = await selectEntries(viewer_id)
    .$if(author_id !== undefined, (qb) => qb.where("e.user_id", "=", author_id!))
    .$if(cursor !== null, (qb) => qb.where("e.id", "<", cursor!))
    .orderBy("e.id", "desc")
    // one extra row tells us whether there's a next page
    .limit(limit + 1)
    .execute();

  const page = rows.slice(0, limit);

  return {
    entries: page.map((row) => toEntry(row, viewer_id)),
    nextCursor: rows.length > limit ? page.at(-1)!.id : null,
  };
}
