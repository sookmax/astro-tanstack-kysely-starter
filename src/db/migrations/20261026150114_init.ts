import type { Kysely } from "kysely";
import { entries } from "../schemas/entries";
import { entryLikes } from "../schemas/entryLikes";
import { entriesV1 } from "../seed/entries_v1";

// A migration only composes { up, down } modules. Once a migration has run in
// production it's frozen: later schema changes get their own migration file
// (name it with `pnpm db:timestamp`), never an edit here.

export async function up(db: Kysely<any>): Promise<void> {
  await entries.up(db);
  await entryLikes.up(db);
  await entriesV1.up(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await entriesV1.down(db);
  await entryLikes.down(db);
  await entries.down(db);
}
