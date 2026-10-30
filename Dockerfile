# syntax=docker/dockerfile:1.7
#
# ONE image, the full build environment (all dependencies + source + dist), so
# every script — the migrations included — runs exactly like it does locally.
# A bigger image, traded for no pruned-dependency surprises.
# Build with `pnpm image:build`; the e2e stack (compose.yaml, profile `test`)
# runs this exact image.

FROM node:24-bookworm-slim AS base
# tini as PID 1 forwards SIGTERM to node (which, as PID 1, would ignore it and
# sit out the whole stop timeout).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates wget libatomic1 tini \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN wget -qO- https://get.pnpm.io | env PNPM_VERSION=12.3.4 ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
WORKDIR /app

# Dependencies — cached until a manifest changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

# Source + the Astro standalone server build. No secrets needed: nothing is
# prerendered, so no server module runs at build time.
FROM deps AS build
COPY . .
RUN pnpm build

FROM build AS runtime
# Runtime config (DATABASE_URL, BETTER_AUTH_SECRET) comes from the platform,
# read via process.env.
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
EXPOSE 4321
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./start-prod.sh"]
