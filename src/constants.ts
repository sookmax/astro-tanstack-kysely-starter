// Limits shared by a DB CHECK and the Zod schema that mirrors it, so the two
// can't drift. Imports NOTHING: client-safe modules (src/lib/schemas/*) import
// this file, and anything that reached `pg` from here would break hydration.
export const ENTRY_BODY_MAX_LENGTH = 280;
