import * as z from "zod";
import { ENTRY_BODY_MAX_LENGTH } from "@/constants";

// Mirrors the DB's entries_body_length_check through the shared constant, so
// the two limits can't drift.
export const InsertEntryBodySchema = z.object({
  body: z.string().trim().min(1).max(ENTRY_BODY_MAX_LENGTH),
});

export type InsertEntryBody = z.infer<typeof InsertEntryBodySchema>;

export const InsertEntryResultSchema = z.object({ id: z.number() });

export type InsertEntryResult = z.infer<typeof InsertEntryResultSchema>;
