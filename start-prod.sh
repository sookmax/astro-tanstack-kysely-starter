#!/bin/sh
#
# The image's start command: migrate, then serve. The health check
# (/api/health) fails until the server listens, so during a rolling deploy the
# old container keeps serving while migrations run, and a failed migration
# never turns healthy. A no-op when the DB is already up to date. Because old
# and new code briefly share the new schema, keep migrations additive
# (expand first, drop in a later release).
set -e

# better-auth's tables first, then ours (which reference `users`, and seed).
pnpm run db:migrate:deploy

# exec: node replaces this shell, so tini signals it directly.
exec node ./dist/server/entry.mjs
