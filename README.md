# ПрофКласс · КП AI — Шаг 1

MVP приложения расчёта коммерческих предложений (оснащение СПО, обоснование НМЦК).
Стек: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**.

Реализовано в Шаге 1:

- Экран **«Расчёт КП»** — плотная таблица позиций с мгновенным пересчётом
  (Закуп+дост, Цена PSK, Альт 1/2, Сумма), строка ИТОГО, правая панель настроек
  (коэффициенты, себестоимость/прибыль, документ, юрлица с бейджами НДС, опции PDF, итоги).
- **Сохранение/загрузка** расчёта и **Архив КП** с раскрытием состава позиций и кнопкой
  «Открыть в расчёте».
- **Auth-гейт**: неавторизованный пользователь редиректится на `/login`.
- Вкладки «Проверка рынка», «Поставщик по ИНН», «База товаров» — заглушки `ComingSoon`
  (активируются на следующем шаге).

## Запуск

> Требуется Node.js 18+. Если Node не установлен глобально, в этой машине он лежит
> в `~/.local/node/bin` — добавьте в PATH: `export PATH="$HOME/.local/node/bin:$PATH"`.

```bash
npm install
npm run dev
# http://localhost:3000
```

## Режимы работы

Приложение читает `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` из `.env.local`.

- **Демо-режим** (переменные пусты) — данные хранятся в `localStorage` браузера,
  вход по любому e-mail и паролю. Удобно для локальной проверки без Supabase.
- **Боевой режим** — заполните ключи из Supabase → Settings → API. Тогда используются
  реальные таблицы с RLS и Supabase Auth.

## Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. SQL Editor → New query → выполните [`supabase/schema.sql`](supabase/schema.sql)
   (таблицы `entities`, `quotes`, `quote_items`, RLS-политики, сид юрлиц).
3. Authentication → Settings: выключите Confirm email и Enable sign-up,
   создайте пользователей вручную (директор + менеджеры).
4. Скопируйте `.env.example` → `.env.local` и вставьте URL и anon key.

## Формулы

```ts
realZakup = zakup + dostavka              // за ед.
pricePsk  = realZakup * (1 + markup / 100)
priceAlt1 = pricePsk * coeffKp2
priceAlt2 = pricePsk * coeffKp3
summa     = pricePsk * qty
```

Чистые функции расчёта — в [`src/lib/formulas.ts`](src/lib/formulas.ts).

## Структура

```
src/
  app/
    login/page.tsx          вход
    (app)/
      layout.tsx            nav + ToastProvider (auth-гейт в middleware)
      page.tsx              экран расчёта
      archive/page.tsx      архив КП
      market|inn|products/  ComingSoon
  components/
    QuoteTable / QuoteTableRow / QuoteSidebar / ArchiveCard / AppNav / ComingSoon
    ui/ Button, Input, Toggle, Badge, Toast
  lib/
    formulas.ts             чистые функции расчёта
    types.ts                Quote, QuoteItem, Entity, RowState
    entities.ts             сид юрлиц
    store.ts                data-слой (Supabase ↔ demo/localStorage)
    supabase/ client, server, middleware, config
  middleware.ts             рефреш сессии + редирект на /login
supabase/schema.sql         схема БД
```
