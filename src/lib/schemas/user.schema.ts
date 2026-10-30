import * as z from "zod";
import { DateSchema } from "./common.schema";

// The shape of the `[user]` query, decoded through this on both sides: the
// server seed from `locals.user` (ReactServerEntry) and the client's
// getSession() (query-client.ts). On the server it's a real redaction — the
// seed is serialized into the page HTML, and only these fields go in. On the
// client it only trims what's cached: getSession() is better-auth's own
// endpoint and returns the viewer's full user (email included) to the browser
// before this runs — fine, it's their own data.
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  createdAt: DateSchema,
});

export type User = z.infer<typeof UserSchema>;
