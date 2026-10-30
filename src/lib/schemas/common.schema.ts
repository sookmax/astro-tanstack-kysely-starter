import * as z from "zod";

// A timestamptz arrives as a real Date on a direct hit (the dehydrated cache is
// shipped with devalue's `uneval`, which revives Dates) and as an ISO string
// from a client fetch (plain JSON). Accept both, always produce a Date.
export const DateSchema = z
  .union([z.date(), z.string()])
  .transform((value) => (typeof value === "string" ? new Date(value) : value));
