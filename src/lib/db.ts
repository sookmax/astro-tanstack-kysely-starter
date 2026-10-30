import "@/utils/server-module";
import { Pool } from "pg";
import { getKyselyInstance } from "@/db/database";
import { loadEnv } from "./loadEnv";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found.");
}

// One pool for the process, shared by Kysely and better-auth (auth-server.ts).
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = getKyselyInstance(pool);
