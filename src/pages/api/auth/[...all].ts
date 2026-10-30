// https://better-auth.com/docs/integrations/astro#mount-the-handler
import type { APIRoute } from "astro";
import { auth } from "@/lib/auth-server";

export const ALL: APIRoute = (ctx) => auth.handler(ctx.request);
