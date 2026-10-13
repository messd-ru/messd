ARG PLAYWRIGHT_VERSION=1.64.0
ARG TURBO_VERSION=2.11.7

FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS base
ENV PNPM_HOME=/pnpm \
	PATH=/pnpm:$PATH \
	COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

FROM base AS prune
ARG TURBO_VERSION
RUN npm install --global turbo@${TURBO_VERSION}
COPY . .
RUN turbo prune @messd/e2e --docker

FROM base AS test
COPY --from=prune /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile
COPY --from=prune /app/out/full/ .
WORKDIR /app/tests/e2e
CMD ["pnpm", "exec", "playwright", "test"]
