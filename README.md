# MESSD

Self-hosted видеозвонки в браузере без регистрации: звонки один на один и групповые комнаты, сквозное шифрование, демонстрация экрана, размытие фона.

Документация — в [.docs](.docs/README.md), инструкция по запуску — [.docs/getting-started.md](.docs/getting-started.md).

```sh
nvm use && corepack enable && pnpm install
cp .env.example .env
docker compose up -d postgres turn
pnpm dev
```
