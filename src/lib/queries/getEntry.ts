import "@/utils/server-module";
import type { Entry } from "../schemas/entry.schema";
import { selectEntries, toEntry } from "./selectEntries";

// null (not a throw) for a missing entry: the page turns that into a 404
// rewrite, the API route into a 404 response.
export async function getEntry({
  id,
  viewer_id,
}: {
  id: number;
  viewer_id: string | null;
}): Promise<Entry | null> {
  const row = await selectEntries(viewer_id)
    .where("e.id", "=", id)
    .executeTakeFirst();

  return row ? toEntry(row, viewer_id) : null;
}
