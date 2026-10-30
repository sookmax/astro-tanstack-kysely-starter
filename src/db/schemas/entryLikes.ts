import { sql, type Kysely } from "kysely";
import { DatabaseError } from "pg";
import { errorCode } from "../utils/errorCode";
import { bumpEntryLikesCount } from "../functions/bumpEntryLikesCount";

// One row per (entry, user) like. Likes toggle: like = INSERT … ON CONFLICT DO
// NOTHING, unlike = DELETE. The unique constraint caps it at one like per user
// AND makes the counter retry-safe — a duplicate insert is rejected before the
// AFTER INSERT trigger fires, so a double-tap can't double-count.
export const entryLikes = {
  tableName: "entry_likes",

  entry_fk: "entry_likes_entry_fk",
  one_like_per_user: "entry_likes_one_per_user",
  bump_trigger: "entry_likes_bump_likes_count",

  // Liking an entry that doesn't exist trips the FK → the route answers 404.
  isMissingEntryError(error: unknown) {
    return (
      error instanceof DatabaseError &&
      error.code === errorCode.foreign_key_violation &&
      error.constraint === this.entry_fk
    );
  },

  async up(db: Kysely<any>) {
    await bumpEntryLikesCount.up(db);

    await db.schema
      .createTable(this.tableName)
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("entry_id", "integer", (col) => col.notNull())
      // A named FK (not inline .references) so isMissingEntryError can match it.
      .addForeignKeyConstraint(
        this.entry_fk,
        ["entry_id"],
        "entries",
        ["id"],
        (cb) => cb.onDelete("cascade"),
      )
      .addColumn("user_id", "text", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`),
      )
      .addUniqueConstraint(this.one_like_per_user, ["entry_id", "user_id"])
      .execute();

    await sql`
      CREATE TRIGGER ${sql.raw(this.bump_trigger)}
      AFTER INSERT OR DELETE ON ${sql.raw(this.tableName)}
      FOR EACH ROW EXECUTE FUNCTION ${sql.raw(bumpEntryLikesCount.name)}();
    `.execute(db);
  },

  async down(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).execute();
    await bumpEntryLikesCount.down(db);
  },
};
