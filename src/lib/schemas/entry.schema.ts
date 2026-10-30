import * as z from "zod";
import { DateSchema } from "./common.schema";

// Client-safe: no `db` import here (nor anything that imports it). Client fetch
// code and components import schemas + types from src/lib/schemas/* only;
// src/lib/queries/* (which import `pg`) are server-only.
export const EntrySchema = z.object({
  id: z.number(),
  body: z.string(),
  created_at: DateSchema,
  likes_count: z.number().int().nonnegative(),
  // null for seed entries, which have no author
  author: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable(),
    })
    .nullable(),
  // per viewer, computed server-side from the session
  is_liked: z.boolean(),
  is_author: z.boolean(),
});

export type Entry = z.infer<typeof EntrySchema>;
