ARG NODE_VERSION=24.21.0
ARG TURBO_VERSION=2.11.7
ARG CADDY_VERSION=2.11.7

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
RUN turbo prune @messd/web --docker

FROM base AS deps
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile

FROM deps AS dev
ENV NODE_ENV=development
COPY --from=prune /app/out/full/ .
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0"]

FROM deps AS build
COPY --from=prune /app/out/full/ .
RUN pnpm turbo run build --filter=@messd/web

FROM caddy:${CADDY_VERSION}-alpine AS prod
COPY --link apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --link --from=build /app/apps/web/dist /srv
EXPOSE 80 443 443/udp
