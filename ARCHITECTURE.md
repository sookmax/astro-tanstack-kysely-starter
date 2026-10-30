# Architecture

## One cache, two ways in

A page can be entered two ways, and both end at the same TanStack Query cache:

```
DIRECT HIT (full page load)                       CLIENT NAVIGATION (a <Link> click)
───────────────────────────                       ──────────────────────────────────
src/pages/index.astro (frontmatter)               route beforeLoad (src/react/routes/index.tsx)
  queryClient.infiniteQuery(                        queryClient.infiniteQuery(
    getEntryListOptions(viewer))   ← query-server     fetchEntryListOptions)        ← query-client
    queryFn → Kysely → Postgres                       queryFn → fetch /api/entries → Kysely
        │                                                 │
        ▼                                                 ▼
ReactServerEntry.astro                             cache filled under ["entries","list"]
  seeds ["user"], renders the router to a string,
  ships the dehydrated cache as JS (devalue uneval)
        │
        ▼
ReactClientEntry (client:only) hydrates it
  → route beforeLoad runs the CLIENT options,
    finds ["entries","list"] already cached → no request
```

`lib/query-server.ts` and `lib/query-client.ts` build their options from the same keys (`lib/query-common.ts`). That's the trick: the server fills the cache with a DB-backed `queryFn`, so the browser-only `fetch` `queryFn` never runs during SSR or hydration.

## The Astro ↔ TanStack Router bridge

- `ReactServerEntry.astro` renders `<RouterServer>` with `renderToString`, then gets the router's hydration scripts (`$_TSR`, the dehydrated matches) from `transformReadableStreamWithRouter` fed an **empty, closed** stream. With no `<Scripts />` boundary in our fragment, router-core appends those scripts after the app stream, so the output is exactly the HTML to inject. (Older routers exposed this as `serverSsr.takeBufferedHtml()`.)
- The router context carries the live `queryClient` (never serialized) and `dehydratedQueryState` (the only field written into the page, via `uneval`, so `Date`s survive as `new Date(...)` — not `define:vars`, which would JSON-stringify them).
- A loading overlay ships in the first paint and is removed by `__root`'s effect once hydrated (e2e uses its absence as the "hydrated" signal).
- The router plugin code-splits route components **for the client environment only** (`environmentName: "client"` in `tsr.vite.plugin.ts`). Its dev HMR code keeps each split component in `import.meta.hot.data` so it survives re-evaluation — right for the browser (Fast Refresh patches it), but Vite's SSR module runner has `import.meta.hot` too, so the server kept rendering the old component after every edit → hydration mismatch. The server renders everything up front anyway, so it gains nothing from lazy chunks.

## TanStack Query: the `query()` APIs

`fetchQuery`/`prefetchQuery`/`ensureQueryData` (and their infinite twins) are deprecated as of 5.102. This starter uses only the replacements:

| Old | New |
|---|---|
| `fetchQuery(o)` | `await query(o)` |
| `prefetchQuery(o)` | `void query(o).catch(noop)` — `query()` rejects, so fire-and-forget needs a catch |
| `ensureQueryData(o)` | `query({ ...o, staleTime: "static" })` |
| `ensureQueryData({ ...o, revalidateIfStale: true })` | `await query({ ...o, staleTime: "static" })` then `void query(o).catch(noop)` (see `routes/entries/$id.tsx`) |
| `fetchInfiniteQuery(o)` | `await infiniteQuery(o)` |

`query()` also returns the data, so a page's not-found check reads it directly (`pages/entries/[id].astro`). It doesn't accept observer-only options (`refetchOnWindowFocus`, `placeholderData`, …) — keep those out of shared options.

`__root`'s `beforeLoad` only refreshes `["user"]` in the background: the cache is never cold on the client (every page seeds it; the nav's subscription keeps it from being garbage-collected), and child routes read it synchronously for their auth gates.

## Client/server boundary

- `src/lib/queries/*` import the DB (→ `pg`): **server-only**, guarded by `import "@/utils/server-module"`.
- `src/lib/schemas/*.schema.ts` hold Zod schemas + `z.infer` types and import **nothing** that reaches `db`. Client code (fetch wrappers, components, routes) imports from here only — value-importing a schema from a module that also imports `db` drags `pg` into the browser bundle.
- `src/constants.ts` imports nothing, so both a DB CHECK (`src/db/schemas/entries.ts`) and a client-safe Zod schema can share one limit.

## Identity and auth

- The middleware resolves the session once per request into `locals.user`. API routes take identity from `locals`, never from the request — and when they also read the URL, the identity is spread last so a `?author_id=` can't override it.
- Auth-only pages gate twice: the `.astro` page redirects on a direct hit, the route's `beforeLoad` redirects on client navigation. The API re-checks (401) either way.
- `UserSchema` decodes the `["user"]` cache on both sides; on the server that's what keeps `email` etc. out of the HTML.

## Database

- **Migrations are the source of truth**; `src/db/schema.ts` is generated from the live DB after every `pnpm db:migrate`. Never edit it by hand.
- Each table is a `{ up, down }` module (`src/db/schemas/`) that a migration composes. Once a migration has run in production, it's frozen — changes go in a new migration (`pnpm db:timestamp` for the name).
- better-auth owns `users`/`sessions`/`accounts`/`verifications` (created by `pnpm auth:migrate`), and our tables reference `users` — so auth migrates first. `pnpm db:migrate` does both, in order.
- **Seeding is a data migration** (`src/db/seed/`), so dev, the test stack and production seed through the same path; rows are tagged with `seed_id` so `down()` removes exactly them.
- `entries.likes_count` is a denormalized counter maintained by an `AFTER INSERT OR DELETE` trigger on `entry_likes`. The unique `(entry_id, user_id)` constraint rejects a duplicate before the trigger fires, so a double-tap can't double-count. DB errors are matched by `code` + `constraint` name, never by message.
- Lists use keyset pagination on the serial id (`id < cursor`), which stays correct while new rows arrive.

## Mutations

- **Create/delete** invalidate the `["entries"]` prefix (every list and detail entry) and refetch.
- **Like** is optimistic: patch the entry in every cache that holds it, roll back on error, reconcile with the server's count on success. The endpoint returns only `{ entry_id, likes_count, is_liked }`.

## Errors

One `AppError` (status + our own message) crosses every boundary: API routes `return SomeError.response()`, fetch wrappers `throw await AppError.fromResponse(res)`, and one presentational `ErrorView` renders it in the router's `ErrorFallback` and the static `404.astro`/`500.astro`. Raw error messages are never shown in production.

## Lint and type checking

- `oxlint` lints TS/React with type-aware rules **and** reports type errors (`typeCheck: true`), via oxlint-tsgolint's bundled TypeScript 7.
- `astro check` covers `.astro` files, on the `typescript` 6.x devDependency (`@astrojs/check` doesn't support TS 7 yet).
- One `tsconfig.json` serves both — keep it free of TS 6 deprecations, which TS 7 removed.

## Tests

- **Vitest** — co-located `src/**/*.test.ts`, pure functions only (`vite.config.ts` resolves `@/*`).
- **Playwright API** (`e2e/api`) — the `request` fixture; every test signs up a fresh user (`signUp` → better-auth's real endpoint), so tests never share state under `fullyParallel`. Responses are parsed with the app's own Zod schemas.
- **Playwright browser** (`e2e/browser`) — the same specs on Chromium and WebKit (iPhone viewport). The `authedPage` fixture signs up through `context.request`, which shares the page's cookie jar.
- The suite runs against the **production image** (`pnpm e2e:up`), with `SERVER_ENV=test` relaxing only what plain-http testing needs (non-`Secure` cookies — WebKit drops `Secure` ones over http — and better-auth's IP rate limiter).
