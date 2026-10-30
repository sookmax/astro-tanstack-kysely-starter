import "@/utils/server-module";
import { sql } from "kysely";
import { db } from "../db";

export async function pingDb() {
  await sql`select 1`.execute(db);
}
