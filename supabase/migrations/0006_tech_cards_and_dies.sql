-- Adds: production_settings (singleton calculator config), dies (die-cutting
-- tools catalog), tech_cards (one snapshot per order of the full calculator
-- input+result), finished_goods_movements (dated production/shipment ledger),
-- employees + employee_hours (payroll). Also adds raw_materials.grammage
-- (nullable — only paper-type materials use it as the calculator's board
-- catalog). Purely additive: no existing table/column/constraint is changed.

-- ==========================================================================
-- raw_materials.grammage — lets the existing raw material catalog double as
-- the calculator's paper/board catalog, instead of a separate duplicate list.
-- ==========================================================================
alter table raw_materials add column grammage numeric(10,2);

-- ==========================================================================
-- production_settings — singleton row holding the calculator's shared config
-- (glue recipe/norms, tariffs, route operations, overhead, offset tiers).
-- ==========================================================================
create table production_settings (
  id int primary key default 1 check (id = 1),
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger trg_production_settings_updated before update on production_settings
  for each row execute function set_updated_at();

insert into production_settings (id, settings) values (1, '{
  "version": 3,
  "glue": {
    "recipe": [
      { "id": "starch", "name": "Крахмал кукурузный", "kg": 20, "cost": 170000 },
      { "id": "soda", "name": "Сода", "kg": 2, "cost": 20000 },
      { "id": "borax", "name": "Бура", "kg": 0.2, "cost": 6000 },
      { "id": "water", "name": "Вода", "kg": 106, "cost": 300 }
    ],
    "starchNorm": 40,
    "liquidPrice": 2800,
    "liquidNorm": 60,
    "laminationNorm": 60,
    "autoNorm": 3,
    "manualNorm": 4
  },
  "tariffs": { "electricity": 1200, "gas": 2000, "usd": 13000, "amortYears": 7, "repairRate": 5, "workDays": 300, "workHours": 9 },
  "operations": [
    { "id": "corrugator", "name": "Гофроагрегат", "basis": "sheets", "productivity": 2000, "prepMin": 30, "workers": 2, "teamLaborHour": 37777.7777777778, "kw": 26.25, "gasM3h": 8.889, "assetUsd": 35000, "staff": "Гайбулаев Жавохир; Мамаражабов Содик" },
    { "id": "flexo", "name": "Флексопечать", "basis": "boxes", "productivity": 3000, "prepMin": 45, "workers": 1, "teamLaborHour": 23555.5555555556, "kw": 6.6, "gasM3h": 0, "assetUsd": 70000, "staff": "Лантушенко Евгений" },
    { "id": "slotter", "name": "Слоттер / рилевка", "basis": "sheets", "productivity": 2000, "prepMin": 15, "workers": 1, "teamLaborHour": 0, "kw": 14, "gasM3h": 0, "assetUsd": 3000, "staff": "Оператор — уточнить" },
    { "id": "die1", "name": "Высечка №1", "basis": "boxes", "productivity": 800, "prepMin": 30, "workers": 2, "teamLaborHour": 31111.1111111111, "kw": 6, "gasM3h": 0, "assetUsd": 10000, "staff": "Мамасолиев Баходир; Исмоилова Хафиза" },
    { "id": "die2", "name": "Высечка №2", "basis": "boxes", "productivity": 800, "prepMin": 30, "workers": 0, "teamLaborHour": 0, "kw": 6, "gasM3h": 0, "assetUsd": 8000, "staff": "Оператор пока не назначен" },
    { "id": "lamination", "name": "Автомат-кашировка", "basis": "sheets", "productivity": 2000, "prepMin": 45, "workers": 2, "teamLaborHour": 57777.7777777778, "kw": 15, "gasM3h": 0, "assetUsd": 30000, "staff": "Курбонов Баходир; Хусенов Улугбек" },
    { "id": "auto_glue", "name": "Автомат-склейка", "basis": "boxes", "productivity": 2500, "prepMin": 20, "workers": 2, "teamLaborHour": 57777.7777777778, "kw": 3.5, "gasM3h": 0, "assetUsd": 25000, "staff": "Курбонов Баходир; Хусенов Улугбек" },
    { "id": "manual_glue", "name": "Ручная склейка", "basis": "boxes", "productivity": 1000, "prepMin": 0, "workers": 3, "teamLaborHour": 36000, "kw": 3, "gasM3h": 0, "assetUsd": 0, "staff": "Маматкулова Фируза; Кучкарова Наргиза; Садуллаева Фарида" },
    { "id": "packing", "name": "Упаковка", "basis": "boxes", "productivity": 1500, "prepMin": 0, "workers": 3, "teamLaborHour": 31555.5555555556, "kw": 0, "gasM3h": 0, "assetUsd": 0, "staff": "Маматова Бибигуль; Максудова Мавсума; Отаджонова Замира" }
  ],
  "overhead": {
    "plannedArea": 108000,
    "items": [
      { "id": "management", "name": "Руководство", "monthly": 25000000 },
      { "id": "administration", "name": "Администрация", "monthly": 11000000 },
      { "id": "factory", "name": "Общезаводские", "monthly": 49500000 }
    ]
  },
  "offsetTiers": [
    { "from": 1000, "to": 1499, "price": 1100 }, { "from": 1500, "to": 1999, "price": 760 },
    { "from": 2000, "to": 2499, "price": 590 }, { "from": 2500, "to": 2999, "price": 488 },
    { "from": 3000, "to": 3499, "price": 420 }, { "from": 3500, "to": 3999, "price": 372 },
    { "from": 4000, "to": 4999, "price": 335 }, { "from": 5000, "to": 5499, "price": 284 },
    { "from": 5500, "to": 5999, "price": 267 }, { "from": 6000, "to": 6499, "price": 253 },
    { "from": 6500, "to": 6999, "price": 241 }, { "from": 7000, "to": 9999, "price": 231 },
    { "from": 10000, "to": 999999999, "price": 230 }
  ]
}'::jsonb) on conflict (id) do nothing;

-- ==========================================================================
-- dies — die-cutting tool ("нож") catalog, same shape/pattern as suppliers
-- ==========================================================================
create table dies (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  for_product_id uuid references finished_products(id) on delete set null,
  photo_url text,
  purchase_date date,
  status text not null default 'active' check (status in ('active','in_repair','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_dies_updated before update on dies
  for each row execute function set_updated_at();

create or replace function generate_die_code() returns trigger as $$
begin
  if new.code is null then
    new.code := lpad((
      select coalesce(max(code::int), 0) + 1
      from dies
      where code ~ '^[0-9]+$'
    )::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_die_code before insert on dies
  for each row execute function generate_die_code();

-- ==========================================================================
-- tech_cards — one calculator snapshot per order (не переиспользуется
-- автоматически между заказами; связь client_id/product_id только для
-- информационной подсказки "клиент уже заказывал этот товар")
-- ==========================================================================
create table tech_cards (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  product_id uuid not null references finished_products(id) on delete restrict,
  die_id uuid references dies(id) on delete set null,
  input_snapshot jsonb not null,
  result_snapshot jsonb not null,
  settings_snapshot jsonb not null,
  total_cost numeric(14,2) not null,
  unit_cost numeric(14,2) not null,
  sale_price_vat numeric(14,2) not null,
  margin_pct numeric(6,2),
  created_at timestamptz not null default now()
);

create index idx_tech_cards_client_product on tech_cards(client_id, product_id);

-- ==========================================================================
-- finished_goods_movements — dated ledger of produced/shipped/adjustment
-- events, separate from the current finished_products.stock_qty scalar.
-- ==========================================================================
create table finished_goods_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references finished_products(id) on delete restrict,
  order_id uuid references orders(id) on delete set null,
  movement_type text not null check (movement_type in ('produced','shipped','adjustment')),
  qty numeric(14,3) not null,
  movement_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_fgm_product_date on finished_goods_movements(product_id, movement_date);
create index idx_fgm_order on finished_goods_movements(order_id);

-- ==========================================================================
-- employees + employee_hours (payroll, monthly history)
-- ==========================================================================
create table employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  monthly_salary numeric(12,2) not null default 0,
  monthly_norm_hours numeric(8,2) not null default 176,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_employees_updated before update on employees
  for each row execute function set_updated_at();

create table employee_hours (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month date not null,
  hours_worked numeric(8,2) not null default 0,
  salary_snapshot numeric(12,2) not null,
  norm_hours_snapshot numeric(8,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (employee_id, month)
);

create index idx_employee_hours_month on employee_hours(month);

-- ==========================================================================
-- RLS — same open policy pattern as every other table in this app
-- ==========================================================================
alter table production_settings enable row level security;
alter table dies enable row level security;
alter table tech_cards enable row level security;
alter table finished_goods_movements enable row level security;
alter table employees enable row level security;
alter table employee_hours enable row level security;

create policy "public_all_production_settings" on production_settings for all using (true) with check (true);
create policy "public_all_dies" on dies for all using (true) with check (true);
create policy "public_all_tech_cards" on tech_cards for all using (true) with check (true);
create policy "public_all_fgm" on finished_goods_movements for all using (true) with check (true);
create policy "public_all_employees" on employees for all using (true) with check (true);
create policy "public_all_employee_hours" on employee_hours for all using (true) with check (true);
