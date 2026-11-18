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

# --- Final image ---------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NUXT_DUCKDB_PATH=/app/data/app.duckdb

# --chown while copying: a separate `chown -R` would store every file a second time.
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node package.json ./
COPY --chown=node:node scripts ./scripts

# The data scripts use DuckDB from the server bundle instead of a second copy of
# node_modules. The data volume is mounted at /app/data.
RUN ln -s .output/server/node_modules node_modules && mkdir -p data && chown node:node data
USER node

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
