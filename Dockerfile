# syntax=docker/dockerfile:1

# Node 24, as CI. Slim rather than Alpine: some of the build's dependencies
# ship prebuilt binaries for glibc only.
FROM node:24-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Writes the reference from the spec, then builds and prerenders; fails on a
# broken internal link, as in CI.
RUN pnpm build

# The server and what it loads: dist/ carries the dependencies it needs.
FROM node:24-slim
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server.mjs /app/package.json ./
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
