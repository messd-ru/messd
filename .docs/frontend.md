# Фронтенд (`apps/web`)

SPA на React 19 с React Compiler (Babel-пресет `reactCompilerPreset`), React Router 7 (data-роутер), Vite 8, Tailwind 4, Zustand и Zod. Компоненты — shadcn/ui в `packages/ui`.

## Структура

```
src/
  app/                  роутер, корневой layout, оболочка с навигацией
  assets/
    styles/             глобальные стили (подключают токены из @messd/ui)
    svg/                знак MESSD
  pages/
    home/               главная: приветствие, новый звонок, вход по ссылке, поиск людей
    settings/           настройки: устройства, звонки, оформление, уведомления
    room/               комната (загружается лениво)
      components/
        lobby/          лобби и состояние «нет доступа»
        call/           раскладки звонка, панель управления, состояния
        panels/         участники, чат, приглашение
        states/         «комната не найдена»
      hooks/            модель плиток
      lib/              сессия mediasoup, E2EE, локальные медиа, размытие фона, качество связи
      store/            состояние комнаты (Zustand)
  shared/
    api/                HTTP-клиент, клиент сигнализации, запросы
    components/         общие компоненты (логотип, видео, выбор устройств, диалог имени…)
    hooks/              media query, устройства, уровень звука, таймеры, полноэкранный режим
    lib/                форматирование, ссылки, буфер обмена, звуки
    store/              настройки и гостевая сессия (persist в localStorage)
```

Модули `pages/*` не зависят друг от друга. Общее выносится в `shared`.

## Состояние

| Store            | Где                | Что хранит                                                                                    |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `usePreferences` | `shared/store`     | тема, значения по умолчанию для звонков, устройства, уведомления — сохраняется между сессиями |
| `useSession`     | `shared/store`     | гость и токен                                                                                 |
| `useLocalMedia`  | `pages/room/lib`   | свои треки: микрофон, камера (с размытием или без), экран, разрешения                         |
| `useRoomStore`   | `pages/room/store` | участники, их медиа, говорящий, раскладки, панели, чат, реакции, связь                        |

`RoomSession` — класс без React, который управляет транспортами, продюсерами и консюмерами mediasoup, ключами E2EE и переподключением. Он пишет результат в `useRoomStore`. Компоненты получают сессию через `RoomSessionContext`.

## Тема и токены

Цвета макета — CSS-переменные в `packages/ui/src/styles/globals.css`, светлая и тёмная палитры переключаются атрибутом `data-theme` на `<html>`:

| Токен        | Светлая   | Тёмная    |
| ------------ | --------- | --------- |
| `background` | `#faf8f5` | `#0a0a0c` |
| `surface`    | `#f1ede6` | `#101013` |
| `line`       | `#ded8ce` | `#26262b` |
| `muted`      | `#6b6459` | `#85808a` |
| `foreground` | `#1a150f` | `#f2eeec` |
| `accent`     | `#7d5a34` | `#e4483f` |
| `danger`     | `#b23a2a` | `#e4483f` |
| `stage`      | `#e7e1d7` | `#18181c` |

Шрифт — Raleway Variable (`@fontsource-variable`), иконки — lucide. До загрузки React тему выставляет `public/theme.js`, поэтому экран не мигает.

## Экраны макета

| Макет                                  | Реализация                                                   |
| -------------------------------------- | ------------------------------------------------------------ |
| 1a, 1h — главная                       | `pages/home/home-page.tsx`                                   |
| 1b, 1i — лобби                         | `pages/room/components/lobby/lobby.tsx`                      |
| 1c, 1j — 1-на-1, вариант A             | `call/pair-stage.tsx` (`layoutPair = focus`)                 |
| 1d — 1-на-1, вариант B                 | `call/pair-stage.tsx` (`layoutPair = split`)                 |
| 1e, 1k — группа, сетка                 | `call/group-stage.tsx`                                       |
| 1f — группа, говорящий крупно          | `call/group-stage.tsx` (`layoutGroup = speaker`)             |
| 1g, 1l — участники                     | `panels/participants-panel.tsx`                              |
| 1m, 1n — настройки                     | `pages/settings/settings-page.tsx`                           |
| 2a, 2f — ожидание                      | `call/waiting-stage.tsx`                                     |
| 2b, 2g — слабая сеть и переподключение | `call/network-status.tsx`                                    |
| 2c, 2h — комната не найдена            | `states/room-not-found.tsx`                                  |
| 2d, 2i — нет доступа                   | `lobby/lobby-blocked.tsx`, `lobby/permission-help-sheet.tsx` |
| 2e, 2j — собеседник покинул звонок     | `call/peer-left-stage.tsx`                                   |

Десктопная раскладка включается от 1024 px (`useIsDesktop`), мобильная рассчитана на ширину от 390 px и учитывает safe area.
