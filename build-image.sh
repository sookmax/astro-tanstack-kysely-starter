#!/usr/bin/env bash
#
# Build the production image into the local Docker daemon as
# astro-tanstack-kysely-starter:local — the image the e2e stack runs.
# Builds for the host's architecture; to build for a server with a different
# one (e.g. amd64 from an Apple-silicon Mac), add `--platform linux/amd64`.
set -euo pipefail
cd "$(dirname "$0")"

# --pull: pick up base-image security patches instead of a stale local tag.
docker buildx build --target runtime \
  --pull \
  -t astro-tanstack-kysely-starter:local \
  --load .
