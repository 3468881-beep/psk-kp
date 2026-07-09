-- PSK КП AI — Шаг 1. Выполните в Supabase → SQL Editor → New query.

-- ENTITIES: три юрлица-отправителя КП (сид, только чтение для пользователей)
create table entities (
  code        text primary key,  -- 'ip' | 'tehnoprodukt' | 'ata'
  name        text not null,
  full_name   text,
  inn         text,
  kpp         text,
  ogrn        text,
  tax_mode    text not null check (tax_mode in ('usn','osn')),
  vat_rate    int  default 0,    -- 0 для УСН, 20 для ОСН
  requisites  text,
  is_default_for text            -- 'psk' | 'alt1' | 'alt2' | null
);

-- Сид юрлиц
insert into entities values
  ('ip',            'ИП Зиянгиров Н.Н.',     'ИП Зиянгиров Назих Назихович',
   '026813389549',  null,  '324028000158894',
   'usn', 0,
   'ИНН 026813389549, ОГРНИП 324028000158894, г. Уфа',
   'psk'),
  ('tehnoprodukt',  'ООО «Технопродукт»',     null,
   null,            null,  null,
   'osn', 22,
   null,   -- реквизиты уточнить у заказчика
   'alt1'),
  ('ata',           'ООО «АТА»',              null,
   null,            '507401001', null,
   'osn', 22,
   null,   -- реквизиты уточнить у заказчика
   'alt2');

-- QUOTES: шапка расчёта КП
create table quotes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  owner_id      uuid references auth.users,
  kp_no         text,
  customer      text,
  kp_date       date default current_date,
  requisites    text,
  coeff_psk     numeric default 1.30,
  coeff_kp2     numeric default 1.08,
  coeff_kp3     numeric default 1.16,
  entity_psk    text default 'ip'          references entities(code),
  entity_alt1   text default 'tehnoprodukt' references entities(code),
  entity_alt2   text default 'ata'         references entities(code),
  opt_pechat    boolean default false,
  opt_podpis    boolean default false,
  opt_logo      boolean default false,
  status        text default 'draft' check (status in ('draft','saved','sent','won','rejected')),
  total_real    numeric,
  total_psk     numeric,
  avg_markup    numeric
);

-- QUOTE_ITEMS: позиции
create table quote_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  quote_id      uuid references quotes(id) on delete cascade,
  position      int,
  name          text,
  category      text,
  unit          text default 'шт',
  qty           numeric default 1,
  zakup         numeric default 0,
  dostavka      numeric default 0,
  markup        numeric default 30,   -- %
  supplier_name text,
  supplier_inn  text,
  price_psk     numeric,
  price_alt1    numeric,
  price_alt2    numeric,
  summa         numeric,
  market        jsonb
);

-- RLS: общее пространство команды (любой залогиненный видит всё)
alter table quotes      enable row level security;
alter table quote_items enable row level security;

create policy "team_all" on quotes
  for all using (auth.role() = 'authenticated');

create policy "team_all" on quote_items
  for all using (auth.role() = 'authenticated');

-- entities — только чтение
alter table entities enable row level security;
create policy "read_only" on entities
  for select using (true);
