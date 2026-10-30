import { GetEntriesResultSchema } from "@/lib/schemas/getEntries.schema";
import { AppError } from "@/utils/error";

// Client-side fetch wrappers: throw an AppError on !ok, parse the body on
// success (the parse is also where ISO date strings become Dates again).
export async function fetchEntries({
  cursor,
  mine = false,
}: {
  cursor: number | null;
  mine?: boolean;
}) {
  const search = new URLSearchParams();
  if (cursor !== null) search.set("cursor", String(cursor));

  const response = await fetch(
    `${mine ? "/api/me/entries" : "/api/entries"}?${search}`,
  );
  if (!response.ok) throw await AppError.fromResponse(response);

  return GetEntriesResultSchema.parse(await response.json());
}
