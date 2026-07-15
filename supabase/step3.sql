-- PSK КП AI — Шаг 3. Выполните в Supabase → SQL Editor.

-- Кэш проверенных поставщиков (по ИНН)
CREATE TABLE IF NOT EXISTS suppliers (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  inn           text unique not null,
  name          text,
  full_name     text,
  kpp           text,
  ogrn          text,
  registered_at date,
  manager_name  text,
  status        text,
  msp           boolean,
  okved         text,
  address       text,
  tax_debt      numeric,
  reliability_score int,
  checks        jsonb,
  raw           jsonb,
  checked_at    timestamptz default now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON suppliers;
CREATE POLICY "team_all" ON suppliers
  FOR ALL USING (auth.role() = 'authenticated');

-- Кэш результатов проверки рынка
CREATE TABLE IF NOT EXISTS market_cache (
  id            uuid primary key default gen_random_uuid(),
  item_name     text not null,
  name_hash     text unique not null,
  min_price     numeric,
  avg_price     numeric,
  max_price     numeric,
  source_count  int,
  sources       jsonb,
  cached_at     timestamptz default now()
);
ALTER TABLE market_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON market_cache;
CREATE POLICY "team_all" ON market_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- ИП Зиянгиров теперь на УСН со ставкой НДС 5% (для бейджа НДС в интерфейсе).
UPDATE entities SET tax_mode = 'osn', vat_rate = 5 WHERE code = 'ip';
