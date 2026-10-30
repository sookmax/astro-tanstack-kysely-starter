import fs from "node:fs/promises";
import path from "node:path";
import {
  FileMigrationProvider,
  type MigrationResultSet,
  Migrator,
  NO_MIGRATIONS,
} from "kysely/migration";
import { Pool } from "pg";
import { getKyselyInstance } from "./database";
import { loadEnv } from "../lib/loadEnv";

// Usage: tsx src/db/migrate.ts <ls | up | down | to <name|latest|initial>>
// `pnpm db:migrate` runs better-auth's migrations first, then `to latest`.

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = getKyselyInstance(
  new Pool({ connectionString: process.env.DATABASE_URL }),
);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(import.meta.dirname, "migrations"),
  }),
});

function report({ error, results }: MigrationResultSet) {
  for (const result of results ?? []) {
    console.log(
      `[${result.status}] migrate ${result.direction}: "${result.migrationName}"`,
    );
  }
  if (error) throw error;
}

async function main() {
  const [command, target] = process.argv.slice(2);

  switch (command) {
    case "ls": {
      const migrations = await migrator.getMigrations();
      for (const m of migrations) {
        console.log(`${m.executedAt ? "✓" : " "} ${m.name}`);
      }
      return;
    }
    case "up":
      return report(await migrator.migrateUp());
    case "down":
      return report(await migrator.migrateDown());
    case "to":
      if (target === "latest") return report(await migrator.migrateToLatest());
      if (target === "initial") {
        return report(await migrator.migrateTo(NO_MIGRATIONS));
      }
      if (target) return report(await migrator.migrateTo(target));
  }

  console.log("Usage: tsx src/db/migrate.ts <ls | up | down | to <name>>");
  process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
