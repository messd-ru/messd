# Разработка

## Требования

- Node.js 24 LTS (`nvm use` читает `.nvmrc`)
- pnpm 12 через Corepack (`corepack enable`)
- Docker Desktop или Docker Engine с Compose v2

## Локальный запуск без контейнеров приложений

```sh
pnpm install
cp .env.example .env
docker compose up -d postgres turn
pnpm dev
```

`pnpm dev` запускает `api` (3000), `core` (4000) и `web` (5173) через Turborepo. Node.js перезапускает сервисы при изменениях (`--watch`), Vite обновляет модули на лету. Переменные окружения читаются из корневого `.env`.

## Всё в Docker

```sh
docker compose up --build
docker compose watch
```

`compose.yaml` описывает окружение разработки: PostgreSQL, coturn, `api`, `core` и `web` из стадии `dev` их Dockerfile. `docker compose watch` синхронизирует исходники в контейнеры. При изменении `package.json` образ пересобирается.

| Сервис     | Порт на хосте                      |
| ---------- | ---------------------------------- |
| web (Vite) | 5173                               |
| api        | 3000                               |
| core       | 4000, медиа 40000–40001 UDP/TCP    |
| PostgreSQL | 5432                               |
| coturn     | 3478 UDP/TCP, реле 49160–49200 UDP |

## Dockerfile

У каждого приложения один многоэтапный `Dockerfile` с целями `dev` и `prod`:

1. `prune` — `turbo prune <пакет> --docker` оставляет только нужные пакеты и урезанный lockfile.
2. `deps` — `pnpm install` по одним манифестам. Слой кешируется и не пересобирается при изменении исходников; хранилище pnpm монтируется как кеш BuildKit.
3. `dev` — исходники и запуск с `--watch`.
4. `prod-deps` → `prod` — только production-зависимости целевого пакета (`--filter-prod`), непривилегированный пользователь `node`, `HEALTHCHECK`.

Для `web` в `prod` используется Caddy: он отдаёт собранную SPA и проксирует `/api` и `/ws`.

## Скрипты

| Команда                                         | Что делает                                      |
| ----------------------------------------------- | ----------------------------------------------- |
| `pnpm dev`                                      | Запуск всех приложений в режиме разработки      |
| `pnpm build`                                    | Сборка фронтенда                                |
| `pnpm lint`                                     | ESLint во всех пакетах                          |
| `pnpm typecheck`                                | Проверка типов во всех пакетах                  |
| `pnpm format` / `pnpm format:check`             | Prettier                                        |
| `pnpm test`                                     | Тесты Playwright (см. [testing.md](testing.md)) |
| `pnpm --filter @messd/db generate --name <имя>` | Новая миграция Drizzle после изменения схемы    |

## Правила кода

- Единый стиль задают `.prettierrc.json` (табы, без точек с запятой, одинарные кавычки, ширина 90) и `@messd/eslint-config`.
- Комментарии в коде не пишем — код должен объяснять себя сам.
- Внутри пакета импортируем через `#…` с расширением файла, между пакетами — по имени пакета без расширения.
- Бэкенд следует MVC: `models` (данные и доменная логика), `controllers` (обработчики запросов и сообщений), `views` (форма ответов).
- Модули фронтенда (`pages/*`) не импортируют друг друга, общее — в `shared`.
- Новые библиотеки должны активно поддерживаться: без релизов дольше года — нельзя.
