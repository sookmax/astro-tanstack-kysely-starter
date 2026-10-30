import { sql, type Kysely } from "kysely";

// Keeps `entries.likes_count` (a denormalized cache) in step with
// `entry_likes`: +1 per INSERT, -1 per DELETE. Never set the count by hand —
// like/unlike by inserting/deleting rows and the trigger does the rest.
//
// Identifiers go through `sql.raw()`: a plain `${}` would become a bind
// parameter, which plpgsql bodies and DDL can't take ("syntax error at or
// near $1").
export const bumpEntryLikesCount = {
  name: "bump_entry_likes_count",

  async up(db: Kysely<any>) {
    await sql`
    CREATE OR REPLACE FUNCTION ${sql.raw(this.name)}() RETURNS trigger AS $$
    BEGIN
      IF (TG_OP = 'INSERT') THEN
        UPDATE entries SET likes_count = likes_count + 1 WHERE id = NEW.entry_id;
      ELSE
        UPDATE entries SET likes_count = likes_count - 1 WHERE id = OLD.entry_id;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    `.execute(db);
  },

  async down(db: Kysely<any>) {
    await sql`DROP FUNCTION IF EXISTS ${sql.raw(this.name)}();`.execute(db);
  },
};
