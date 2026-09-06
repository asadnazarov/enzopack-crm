# EnzoPack CRM

Веб-CRM для учёта клиентов, заказов, сырья, готовой продукции, поставщиков и финансов производителя картонных коробок EnzoPack. React + Vite + Supabase, без логинов, с Telegram-ботом для ежедневной отчётности.

## Стек

- React 19 + Vite + TypeScript, Tailwind CSS 4, React Query, Recharts, Framer Motion
- Supabase (Postgres + Storage) — вся бизнес-логика (авто-код продукта, списание сырья, себестоимость) в SQL-функциях
- Telegram-бот на Supabase Edge Functions
- Хостинг фронтенда — GitHub Pages через GitHub Actions

## 1. Настройка Supabase

1. Создать проект на [supabase.com](https://supabase.com).
2. В **SQL Editor** выполнить содержимое [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql) — создаст все таблицы, функции, триггеры, view и bucket для фото.
3. В **Settings → API** скопировать `Project URL` и `anon public` ключ.
4. (Для Telegram-функций) в **Settings → API** также понадобится `service_role` ключ — используется только на сервере, никогда не попадает во фронтенд.

## 2. Локальный запуск фронтенда

```bash
npm install
cp .env.example .env   # вписать VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm run dev
```

## 3. Деплой на GitHub Pages

1. Создать репозиторий на GitHub, запушить код в `main`.
2. В **Settings → Pages** выставить Source = `GitHub Actions`.
3. В **Settings → Secrets and variables → Actions** добавить:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (тот же URL проекта — используется workflow'ом ежедневного отчёта)
   - `FUNCTION_SHARED_SECRET` (произвольная строка — общий секрет между GitHub Actions и Edge Function `daily-report`, см. ниже)
4. Если имя репозитория отличается от `enzopack-crm`, поменять `base` в [`vite.config.ts`](vite.config.ts) на `/<имя-репозитория>/`.
5. Push в `main` запускает [`deploy.yml`](.github/workflows/deploy.yml) — сайт публикуется на `https://<аккаунт>.github.io/<репозиторий>/`.

## 4. Telegram-бот

1. Через [@BotFather](https://t.me/BotFather) создать бота (`/newbot`) → сохранить `TELEGRAM_BOT_TOKEN`.
2. Написать боту `/start`, затем получить свой `chat_id` через `https://api.telegram.org/bot<TOKEN>/getUpdates` (или бота [@userinfobot](https://t.me/userinfobot)) → это `TELEGRAM_CHAT_ID` руководителя.
3. Установить Supabase CLI и залогиниться (`supabase login`), затем из корня проекта:
   ```bash
   supabase link --project-ref <project-ref>
   supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... FUNCTION_SHARED_SECRET=...
   supabase functions deploy daily-report
   supabase functions deploy telegram-webhook
   ```
4. Зарегистрировать webhook бота (один раз):
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<project-ref>.supabase.co/functions/v1/telegram-webhook"
   ```
5. В GitHub Secrets репозитория добавить `SUPABASE_URL` и `FUNCTION_SHARED_SECRET` (тем же значением, что задали в Supabase) — workflow [`daily-report.yml`](.github/workflows/daily-report.yml) каждый день в 20:00 (Ташкент) дёргает функцию `daily-report`, которая шлёт сводку в Telegram.
6. Написать боту `/start` в любой момент — покажет кнопки «Сегодня / Неделя / Месяц» либо примет дату в формате `ДД.ММ.ГГГГ`.

## Структура проекта

- `src/` — фронтенд (см. `src/pages`, `src/components`, `src/hooks`)
- `supabase/migrations/` — схема БД и бизнес-логика (SQL)
- `supabase/functions/` — Telegram Edge Functions (Deno)
- `.github/workflows/` — деплой на Pages + ежедневный cron отчёта

## Известное ограничение

Приложение работает без логина, а Supabase `anon key` встроен в публичный JS-бандл — любой обладатель ссылки на сайт технически может читать и изменять данные напрямую через Supabase REST API. Это осознанный компромисс, принятый при отказе от системы ролей/паролей.
