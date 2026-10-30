import { Kysely, PostgresDialect } from "kysely";
import type { Pool } from "pg";
import type { DB } from "./schema";

// `DB` is generated from the live database (pnpm db:codegen, run after every
// pnpm db:migrate), so every query below is typed by the real schema.
export function getKyselyInstance(pool: Pool) {
  return new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
  });
}
