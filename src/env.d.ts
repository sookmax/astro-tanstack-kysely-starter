// https://docs.astro.build/en/guides/typescript/#extending-global-types
// https://better-auth.com/docs/integrations/astro
declare namespace App {
  // `import {} from ""` syntax doesn't work in a .d.ts — use import() types.
  interface Locals {
    user: import("@/lib/auth-server").AuthSession["user"] | null;
    session: import("@/lib/auth-server").AuthSession["session"] | null;
  }
}

interface Window {
  // Written by ReactServerEntry.astro, read once by ReactClientEntry.
  __ROUTER_CONTEXT__: unknown;
}
