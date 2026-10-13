# Развёртывание

Продакшен описан в `compose.prod.yaml`: PostgreSQL, coturn, `api`, `core` и `web` (Caddy с автоматическим HTTPS).

## Что нужно

- Сервер с публичным IPv4, Docker Engine и Compose v2.
- Домен, A-запись которого указывает на сервер (например, `messd.app`).
- Открытые порты:

| Порт        | Протокол  | Сервис                          |
| ----------- | --------- | ------------------------------- |
| 80, 443     | TCP       | Caddy (HTTP → HTTPS, сайт, WSS) |
| 443         | UDP       | Caddy (HTTP/3)                  |
| 40000–40015 | UDP и TCP | mediasoup (по порту на воркер)  |
| 3478        | UDP и TCP | TURN                            |
| 5349        | TCP       | TURN поверх TLS                 |
| 49160–49200 | UDP       | Реле TURN                       |

## Переменные окружения

Создайте `.env` рядом с `compose.prod.yaml`:

```env
DOMAIN=messd.app
POSTGRES_USER=messd
POSTGRES_PASSWORD=<длинный случайный пароль>
POSTGRES_DB=messd
LOG_LEVEL=info

RTC_ANNOUNCED_ADDRESS=<публичный IP сервера>
MEDIASOUP_WORKERS=4
MAX_PEERS=50
ROOM_CLOSE_DELAY_MS=60000
PEER_RECONNECT_GRACE_MS=20000

TURN_SECRET=<длинный случайный секрет>
TURN_REALM=messd.app
TURN_URLS=turn:messd.app:3478?transport=udp,turn:messd.app:3478?transport=tcp,turns:messd.app:5349?transport=tcp
TURN_CERTS_DIR=/etc/letsencrypt/live/messd.app
```

`MEDIASOUP_WORKERS` не должен превышать число опубликованных медиапортов (по умолчанию 16: 40000–40015). Чтобы запустить больше воркеров, расширьте диапазон в `compose.prod.yaml`.

## TLS

- Сайт и сигнализация: Caddy сам получает и продлевает сертификат Let's Encrypt для `DOMAIN`. Сертификаты хранятся в томе `caddy-data`.
- TURN поверх TLS: coturn читает `fullchain.pem` и `privkey.pem` из `TURN_CERTS_DIR`. Используйте сертификат того же домена. Например, получите его через certbot или скопируйте из тома Caddy и перезапускайте `turn` после продления.

## Запуск и обновление

```sh
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f core
```

Миграции базы применяются автоматически при старте `api`. Обновление: `git pull` и повторная команда `up -d --build`. Активные звонки прервутся на время перезапуска `core`, но клиенты переподключатся сами.

## Резервное копирование

```sh
docker compose -f compose.prod.yaml exec postgres pg_dump -U messd messd > backup.sql
```

## Проверка

- `https://<домен>/api/health` возвращает `{"status":"ok"}`.
- В звонке значок замка показывает «Сквозное шифрование».
- Если медиа не идёт, проверьте `RTC_ANNOUNCED_ADDRESS` и доступность UDP-портов 40000+ снаружи.
