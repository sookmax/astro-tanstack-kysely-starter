import { sql, type Kysely } from "kysely";
import { DatabaseError } from "pg";
import { ENTRY_BODY_MAX_LENGTH } from "@/constants";
import { errorCode } from "../utils/errorCode";

// A guestbook entry. Each table is a `{ up, down }` module that migrations
// compose; constraint names live on the module so error matchers can't drift
// from the DDL.
export const entries = {
  tableName: "entries",

  body_length_check: "entries_body_length_check",

  // A backstop behind the Zod length check in insertEntry.schema.ts.
  isInvalidBodyError(error: unknown) {
    return (
      error instanceof DatabaseError &&
      error.code === errorCode.check_violation &&
      error.constraint === this.body_length_check
    );
  },

  async up(db: Kysely<any>) {
    await db.schema
      .createTable(this.tableName)
      .addColumn("id", "serial", (col) => col.primaryKey())
      // NULL = a seed entry (no author). better-auth owns `users`, so
      // `pnpm auth:migrate` must run before this migration (pnpm db:migrate
      // does both, in that order).
      .addColumn("user_id", "text", (col) =>
        col.references("users.id").onDelete("cascade"),
      )
      .addColumn("body", "text", (col) => col.notNull())
      // Maintained by the bump_entry_likes_count trigger (entryLikes.ts).
      // `integer`, not bigint: bigint deserializes to a string in node-postgres.
      .addColumn("likes_count", "integer", (col) => col.notNull().defaultTo(0))
      // Tags rows inserted by a seed migration, so its down() deletes exactly
      // those rows and never a user's.
      .addColumn("seed_id", "text")
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`),
      )
      .addCheckConstraint(
        this.body_length_check,
        sql`char_length(body) BETWEEN 1 AND ${sql.lit(ENTRY_BODY_MAX_LENGTH)}`,
      )
      .execute();

    // The "my entries" list filters on the author, newest first.
    await db.schema
      .createIndex("entries_user_id_id_index")
      .on(this.tableName)
      .columns(["user_id", "id desc"])
      .execute();
  },

  async down(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).execute();
  },
};
