import type { APIRoute } from "astro";
import { pingDb } from "@/lib/queries/pingDb";

// The container healthcheck: up AND able to reach the database. The middleware
// skips this path (no session lookup).
export const GET: APIRoute = async () => {
  try {
    await pingDb();
    return new Response("ok", { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response("db unreachable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
