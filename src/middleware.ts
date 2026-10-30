import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth-server";

export const onRequest = defineMiddleware(async (context, next) => {
  // The container healthcheck probes this every few seconds; it needs no
  // session lookup.
  if (context.url.pathname === "/api/health") return next();

  // Identity is resolved once, here, from the session cookie. Pages and API
  // routes read `locals.user` — never a user id from the request.
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  context.locals.user = session?.user ?? null;
  context.locals.session = session?.session ?? null;

  const response = await next();

  // Every API response is personalized (is_liked, is_author, "my entries"), so
  // no CDN, proxy or bfcache may hand one viewer's response to another.
  if (context.url.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
});
