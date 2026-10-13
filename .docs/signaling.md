# Сигнализация (`apps/core`)

WebSocket `wss://<домен>/ws`. Сообщения — JSON, схемы и типы лежат в `@messd/contracts/signaling`.

## Формат

Запрос клиента:

```json
{ "id": 7, "type": "join", "data": { "...": "..." } }
```

Ответ сервера на запрос:

```json
{ "kind": "response", "id": 7, "ok": true, "data": { "...": "..." } }
{ "kind": "response", "id": 7, "ok": false, "error": { "code": "room_full", "message": "Комната заполнена" } }
```

Событие от сервера:

```json
{ "kind": "event", "type": "peerJoined", "data": { "peer": { "...": "..." } } }
```

Первым сообщением клиент отправляет `hello` с гостевым токеном. Сервер раз в 15 секунд проверяет соединение ping/pong.

## Запросы

| Тип                                                    | Данные                                                      | Ответ                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `hello`                                                | `{ token }`                                                 | `{ guestId, name }`                                                |
| `peek`                                                 | `{ code }`                                                  | `{ room, routerRtpCapabilities }` + подписка на `roomChanged`      |
| `join`                                                 | `{ code, peerId?, rtpCapabilities, publicKey }`             | `{ peerId, peers, producers }`                                     |
| `createTransport`                                      | `{ direction: "send" \| "recv" }`                           | `{ id, iceParameters, iceCandidates, dtlsParameters, iceServers }` |
| `connectTransport`                                     | `{ transportId, dtlsParameters }`                           | `{}`                                                               |
| `restartIce`                                           | `{ transportId }`                                           | `{ iceParameters }`                                                |
| `produce`                                              | `{ transportId, kind, rtpParameters, source }`              | `{ producerId }`                                                   |
| `pauseProducer` / `resumeProducer` / `closeProducer`   | `{ producerId }`                                            | `{}`                                                               |
| `consume`                                              | `{ producerId }`                                            | `{ id, producerId, peerId, kind, source, rtpParameters }`          |
| `resumeConsumer` / `pauseConsumer` / `requestKeyFrame` | `{ consumerId }`                                            | `{}`                                                               |
| `setConsumerLayer`                                     | `{ consumerId, spatialLayer }`                              | `{}`                                                               |
| `updateState`                                          | `{ hand?, quality? }`                                       | `{}`                                                               |
| `reaction`                                             | `{ emoji }`                                                 | `{}`                                                               |
| `chat`                                                 | `{ iv, data, index }` — зашифрованное сообщение             | `{}`                                                               |
| `e2eeKey`                                              | `{ to, sealed }` — ключ для конкретного участника           | `{}`                                                               |
| `invite`                                               | `{ guestId, code }`                                         | `{ delivered }`                                                    |
| `moderate`                                             | `{ peerId, action: "mute" \| "remove" }` — только создатель | `{}`                                                               |
| `leave`                                                | `{}`                                                        | `{}`                                                               |

`source` — `mic`, `camera` или `screen`. Состояние микрофона, камеры и экрана сервер выставляет сам по продюсерам, клиент не может его подделать.

## События

| Тип                          | Данные                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| `roomChanged`                | `{ room }` — для лобби                                      |
| `peerJoined` / `peerUpdated` | `{ peer }`                                                  |
| `peerLeft`                   | `{ peerId }`                                                |
| `newProducer`                | `{ producerId, peerId, kind, source }`                      |
| `producerClosed`             | `{ producerId, peerId }`                                    |
| `activeSpeaker`              | `{ peerId \| null }` — по уровню звука (AudioLevelObserver) |
| `reaction`                   | `{ peerId, emoji }`                                         |
| `chat`                       | `{ peerId, sealed, at }`                                    |
| `e2eeKey`                    | `{ from, sealed }`                                          |
| `invited`                    | `{ code, from: { guestId, name } }` — входящий звонок       |
| `forceMute` / `removed`      | `{}` — действия создателя                                   |

## Коды ошибок

`bad_request`, `unauthorized`, `room_not_found`, `room_ended`, `room_full`, `not_joined`, `forbidden`, `internal`.

## Переподключение

При потере WebSocket участник помечается `reconnecting: true`, его медиа не закрывается в течение `PEER_RECONNECT_GRACE_MS`. Клиент переподключается с экспоненциальной задержкой и повторяет `join` с прежним `peerId`: сервер пересоздаёт транспорты, а остальные участники видят «Переподключается…» вместо выхода. Если окно истекло, участник удаляется.
