import "@/utils/server-module";
import { betterAuth } from "better-auth";
import { pool } from "./db";

// This file is loaded two ways: by the app (under Vite) and by the better-auth
// CLI (`pnpm auth:migrate`, plain Node). Read config from process.env — NOT
// import.meta.env, which doesn't exist in the CLI. (And never a non-exact
// `import.meta.env` expression like `import.meta.env?.DEV`: Vite then inlines
// the WHOLE env object, every secret in .env included, into the bundle.)
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET not found.");
}

// The e2e stack runs the production image over plain http (compose.yaml sets
// SERVER_ENV=test). Never true in production.
const isTestApp = process.env.SERVER_ENV === "test";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  // better-auth derives its base URL from the request's Host header and only
  // accepts these hosts. Add your production domain here.
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*"],
  },
  database: pool,
  // Email + password: works with zero setup. Add a social provider via
  // `socialProviders` when you have OAuth credentials.
  emailAndPassword: {
    enabled: true,
  },
  // Plural table names, matching the app's own tables.
  user: { modelName: "users" },
  session: {
    modelName: "sessions",
    // A signed cookie caches the session for 5 minutes, so the middleware's
    // getSession() on every request doesn't hit the DB each time.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  account: { modelName: "accounts" },
  verification: { modelName: "verifications" },
  ...(isTestApp
    ? {
        // better-auth's limiter keys on client IP, and inside the test
        // container every request looks like the same IP — a parallel suite
        // signing up per test would trip it in seconds.
        rateLimit: { enabled: false },
        // NODE_ENV=production defaults to `__Secure-` cookies. Chromium sends
        // those over http://localhost, but WebKit drops them, so every authed
        // WebKit test would be signed out. Plain cookies on the http stack.
        advanced: { useSecureCookies: false },
      }
    : {}),
});

export type AuthSession = typeof auth.$Infer.Session;
