# syntax=docker/dockerfile:1

# Bun installs packages and runs the data scripts; Node runs the Nuxt server.
FROM oven/bun:1.4.4-slim AS bun

FROM node:24-bookworm-slim AS base
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# --- Build the Nuxt app --------------------------------------------------------
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

# --- Runtime dependencies for the data scripts (DuckDB only) ------------------
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# --- Final image ---------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NUXT_DUCKDB_PATH=/app/data/app.duckdb

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY package.json ./
COPY scripts ./scripts

# The data volume is mounted at /app/data; run as the unprivileged "node" user.
RUN mkdir -p data && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
