import * as z from "zod";
import { EntrySchema } from "./entry.schema";

export const ENTRIES_PAGE_SIZE = 10;

// What an entries list endpoint accepts in its query string. Keyset
// pagination: `cursor` is the last id of the previous page (exclusive).
export const GetEntriesSearchParamsSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export type GetEntriesSearchParams = z.infer<
  typeof GetEntriesSearchParamsSchema
>;

export const GetEntriesResultSchema = z.object({
  entries: z.array(EntrySchema),
  // the id to pass as the next page's `cursor`, or null on the last page
  nextCursor: z.number().nullable(),
});

export type GetEntriesResult = z.infer<typeof GetEntriesResultSchema>;
