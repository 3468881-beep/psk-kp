-- PSK КП AI — Шаг 2. Выполните в Supabase → SQL Editor.

-- 1. Обновить реквизиты трёх юрлиц
UPDATE entities SET
  inn = '0275914810',
  kpp = '027501001',
  ogrn = '1180280026563',
  full_name = 'Общество с ограниченной ответственностью «Технопродукт»',
  requisites = '450077, РФ, Респ. Башкортостан, г. Уфа, ул. Коммунистическая, д.45/3 пом. 209'
WHERE code = 'tehnoprodukt';

UPDATE entities SET
  inn = '5074065643',
  kpp = '507401001',
  full_name = 'Общество с ограниченной ответственностью «АТА»',
  requisites = '142117, Московская область, г. Подольск, Парковая ул., д. 54, офис 11-1. р/с 40702810940000085470, ПАО СБЕРБАНК, к/с 30101810600000000225, БИК 044525225'
WHERE code = 'ata';

UPDATE entities SET
  full_name = 'Индивидуальный предприниматель Зиянгиров Нафис Назихович',
  requisites = 'р/с 40802810620000387808, ООО «Банк Точка», БИК 044525104'
WHERE code = 'ip';

-- Ставка НДС для ОСН — 22%.
UPDATE entities SET vat_rate = 22 WHERE tax_mode = 'osn';

-- 2. Таблица для хранения ссылок на PDF.
-- unique(quote_id, kind) нужен для upsert(..., { onConflict: 'quote_id,kind' }).
CREATE TABLE IF NOT EXISTS generated_pdfs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  quote_id      uuid references quotes(id) on delete cascade,
  kind          text check (kind in ('psk','alt1','alt2')),
  entity_code   text references entities(code),
  storage_path  text,
  generated_at  timestamptz default now(),
  unique (quote_id, kind)
);
ALTER TABLE generated_pdfs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_all" ON generated_pdfs;
CREATE POLICY "team_all" ON generated_pdfs
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Storage — приватный бакет pdfs + политики.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "auth_read" ON storage.objects;
DROP POLICY IF EXISTS "auth_write" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete" ON storage.objects;

CREATE POLICY "auth_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "auth_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
