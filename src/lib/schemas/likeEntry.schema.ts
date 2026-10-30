import * as z from "zod";

// A lean response, not the whole entry: the client has already flipped the
// like optimistically and only needs the authoritative count to reconcile.
export const LikeEntryResultSchema = z.object({
  entry_id: z.number(),
  likes_count: z.number().int().nonnegative(),
  is_liked: z.boolean(),
});

export type LikeEntryResult = z.infer<typeof LikeEntryResultSchema>;
