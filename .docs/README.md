# MESSD — документация

MESSD — self-hosted сервис видеозвонков в браузере. Регистрация не нужна: гость вводит имя, создаёт комнату и отправляет ссылку вида `messd.app/<код>`. Поддерживаются звонки один на один и групповые комнаты, сквозное шифрование медиа, демонстрация экрана, размытие фона, чат и реакции.

## Разделы

| Документ                                 | О чём                                                             |
| ---------------------------------------- | ----------------------------------------------------------------- |
| [getting-started.md](getting-started.md) | Пошаговая инструкция по запуску: локально, в Docker, в продакшене |
| [architecture.md](architecture.md)       | Монорепозиторий, сервисы, потоки данных, масштабирование          |
| [development.md](development.md)         | Локальный запуск, Docker, скрипты, правила кода                   |
| [deployment.md](deployment.md)           | Продакшен: домен, TLS, TURN, переменные окружения, порты          |
| [api.md](api.md)                         | REST API сервиса `api`                                            |
| [signaling.md](signaling.md)             | Протокол WebSocket сервиса `core`                                 |
| [security.md](security.md)               | Сквозное шифрование, TLS, TURN, CSP, ограничения                  |
| [frontend.md](frontend.md)               | Структура SPA, состояние, дизайн-токены, экраны макета            |
| [testing.md](testing.md)                 | Тесты Playwright: проекты, запуск, окружение                      |
| [decisions.md](decisions.md)             | Принятые решения и отступления от ТЗ и макета                     |

## Быстрый старт

```sh
nvm use
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres turn
pnpm dev
```

Приложение откроется на <http://localhost:5173>. Полный стек в контейнерах: `docker compose up --build` (подробнее — в [development.md](development.md)).
