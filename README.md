# astro-tanstack-kysely-starter

A fullstack starter: **Astro** SSR with **React** islands driven by **TanStack Router**, data loading through **TanStack Query** (the same cache filled on the server and hydrated on the client), **Kysely** over Postgres, **better-auth**, and **Tailwind CSS** — with **Storybook**, **Vitest** units and **Playwright** API + browser tests against the production Docker image.

The demo app is a tiny **guestbook**: a public list of entries, entry pages, sign-up/sign-in, an auth-only composer, "my entries", and optimistic likes counted by a Postgres trigger. Every feature exists to show one part of the stack — see [ARCHITECTURE.md](ARCHITECTURE.md). Working with a coding agent? [AGENTS.md](AGENTS.md) has the rules and recipes (`CLAUDE.md` imports it).

## Stack

|            |                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Rendering  | Astro 7 (SSR, `@astrojs/node` standalone) + React 19                                                                     |
| Routing    | TanStack Router (file-based, SSR via a hand-rolled Astro bridge)                                                         |
| Data       | TanStack Query 5 — the `query()` / `infiniteQuery()` APIs (no deprecated `fetchQuery`/`prefetchQuery`/`ensureQueryData`) |
| Database   | Postgres 18 + Kysely, migrations + generated types (kysely-codegen)                                                      |
| Auth       | better-auth (email + password)                                                                                           |
| Validation | Zod 4, shared by API routes, fetch wrappers and forms                                                                    |
| Styling    | Tailwind CSS 4 with `light-dark()` semantic tokens                                                                       |
| Tooling    | oxlint (type-aware), `astro check`, Prettier, Storybook 10, Vitest, Playwright                                           |

## Getting started

Requires Node 24, pnpm and Docker.

```bash
pnpm install
cp .env.example .env        # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:up                  # Postgres in Docker, on localhost:54320
pnpm db:migrate             # better-auth tables, then Kysely migrations (+ seed), then codegen
pnpm dev                    # http://localhost:4321
```

## Commands

```bash
pnpm dev                    # dev server
pnpm build && pnpm start    # production build, served by node

pnpm lint                   # oxlint (TS/React, type-aware) + astro check (.astro files)
pnpm test                   # Vitest units (src/**/*.test.ts)
pnpm test:e2e               # Playwright against the Docker test stack (builds + boots it if needed)
pnpm test:e2e:dev           # Playwright against `pnpm dev` instead
pnpm storybook              # http://localhost:6006

pnpm db:init                # drop + recreate the dev DB, then migrate (+ seed)
pnpm db:migrate             # auth migrate → kysely migrate to latest → db:codegen
pnpm db:codegen             # regenerate src/db/schema.ts from the live DB
pnpm db:timestamp           # a prefix for a new migration file name

pnpm image:build            # build the production image (astro-tanstack-kysely-starter:local)
pnpm e2e:up / e2e:down      # boot / tear down the test stack (app on :4400)
```

## Layout

```
src/
  pages/                 Astro pages (fill the query cache) + API routes (src/pages/api)
  components/            ReactServerEntry.astro — the SSR half of the router bridge
  react/                 router.tsx, ReactClientEntry.tsx, routes/, components/, hooks/
  lib/
    query-common.ts      query keys + QueryClient defaults (shared)
    query-server.ts      server options: queryFn reads the DB        ┐ same keys
    query-client.ts      client options: queryFn fetches the API     ┘
    queries/             server-only DB queries (import pg)
    schemas/             client-safe Zod schemas + types (never import db)
    fetch/               client fetch wrappers
    auth-server.ts, auth-client.ts
  db/                    Kysely: schemas/, functions/, migrations/, seed/, generated schema.ts
  constants.ts           limits shared by DB CHECKs and Zod schemas (imports nothing)
e2e/
  api/                   Playwright `request` specs (API contract)
  browser/               Playwright browser specs (chromium + mobile-safari)
```

## Deploying

The image migrates on start (`start-prod.sh`), then serves on `:4321`. Provide `DATABASE_URL` and `BETTER_AUTH_SECRET`, and add your domain to `baseURL.allowedHosts` in `src/lib/auth-server.ts`. Behind a TLS-terminating proxy, also set `advanced.trustedProxyHeaders: true` there so OAuth/callback URLs come out `https`.

## License

MIT
