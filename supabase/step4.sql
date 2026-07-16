-- PSK КП AI — Шаг 4 «База товаров». Выполните в Supabase → SQL Editor.
-- ВАЖНО: таблицы products в Шаге 1 не было — создаём её здесь.

CREATE TABLE IF NOT EXISTS products (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  name          text not null,
  unit          text default 'шт',
  default_zakup numeric default 0,
  supplier_name text,
  supplier_inn  text,
  uses_count    int default 0
);

-- Уникальность по наименованию — нужна для upsert(..., { onConflict: 'name' }).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_unique;
ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON products;
CREATE POLICY "team_all" ON products
  FOR ALL USING (auth.role() = 'authenticated');
