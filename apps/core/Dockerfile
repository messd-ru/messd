ARG NODE_VERSION=24.21.0
ARG TURBO_VERSION=2.11.7

FROM node:${NODE_VERSION}-trixie-slim AS base
ENV PNPM_HOME=/pnpm \
	PATH=/pnpm:$PATH \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

FROM base AS prune
ARG TURBO_VERSION
RUN npm install --global turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune @messd/core --docker

FROM base AS toolchain
RUN apt-get update \
	&& apt-get install --yes --no-install-recommends g++ make python3 python3-pip \
	&& rm -rf /var/lib/apt/lists/*

FROM toolchain AS deps
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile

FROM deps AS dev
ENV NODE_ENV=development
COPY --from=prune /app/out/full/ .
WORKDIR /app/apps/core
EXPOSE 4000 40000-40015/udp 40000-40015/tcp
CMD ["node", "--watch", "src/server.ts"]

FROM toolchain AS prod-deps
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile --prod --filter-prod "@messd/core..."

FROM node:${NODE_VERSION}-trixie-slim AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app ./
COPY --from=prune --chown=node:node /app/out/full/ ./
USER node
WORKDIR /app/apps/core
EXPOSE 4000 40000-40015/udp 40000-40015/tcp
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
	CMD ["node", "-e", "fetch('http://127.0.0.1:4000/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "src/server.ts"]
