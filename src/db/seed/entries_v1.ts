import type { Kysely } from "kysely";

// Seeding is a DATA MIGRATION, not a separate script: `migrate to latest` runs
// it, so dev, the e2e stack and prod all get the same rows through one path.
// Every row is tagged with `seed_id`, so down() removes exactly these.
const SEED_ID = "entries_v1";

const BODIES = [
  "First! This guestbook is rendered on the server, then hydrated by TanStack Router.",
  "The list you're reading was fetched straight from Postgres in the Astro frontmatter.",
  "Click through to an entry — that navigation runs on the client and hits the API instead.",
  "Likes are counted by a Postgres trigger, so the count can never drift from the rows.",
  "Sign up to leave an entry of your own.",
];

export const entriesV1 = {
  async up(db: Kysely<any>) {
    // Inserted oldest → newest, so the first body is the oldest entry.
    for (const body of BODIES) {
      await db
        .insertInto("entries")
        .values({ body, seed_id: SEED_ID })
        .execute();
    }
  },

  async down(db: Kysely<any>) {
    await db.deleteFrom("entries").where("seed_id", "=", SEED_ID).execute();
  },
};
