-- EnzoPack CRM — initial schema
-- Apply via Supabase SQL editor or `supabase db push`.

create extension if not exists pgcrypto;

-- ==========================================================================
-- Helper: updated_at trigger
-- ==========================================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- ==========================================================================
-- Tables
-- ==========================================================================

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  logo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  supplies text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function set_updated_at();

create table raw_materials (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  unit text not null,
  photo_url text,
  supplier_id uuid references suppliers(id) on delete set null,
  unit_price numeric(12,2) not null default 0,
  stock_qty numeric(14,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_raw_materials_code on raw_materials(code);
create trigger trg_raw_materials_updated before update on raw_materials
  for each row execute function set_updated_at();

create table finished_products (
  id uuid primary key default gen_random_uuid(),
  code varchar(3) unique,
  name text not null,
  photo_url text,
  sale_price numeric(12,2) not null default 0,
  stock_qty numeric(14,3) not null default 0,
  cost_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_finished_products_code on finished_products(code);
create trigger trg_finished_products_updated before update on finished_products
  for each row execute function set_updated_at();

create table product_bom (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references finished_products(id) on delete cascade,
  raw_material_id uuid not null references raw_materials(id) on delete restrict,
  qty_per_unit numeric(14,4) not null check (qty_per_unit > 0),
  created_at timestamptz not null default now(),
  unique (product_id, raw_material_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  product_id uuid not null references finished_products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  delivery_date date,
  status text not null default 'processing'
    check (status in ('processing','in_progress','ready','delivered','cancelled')),
  unit_price numeric(12,2) not null default 0,
  total_amount numeric(14,2) generated always as (quantity * unit_price) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_status on orders(status);
create index idx_orders_client on orders(client_id);
create index idx_orders_product on orders(product_id);
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_material_consumption (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  raw_material_id uuid not null references raw_materials(id) on delete restrict,
  qty_consumed numeric(14,4) not null,
  created_at timestamptz not null default now()
);
create index idx_omc_order on order_material_consumption(order_id);

create table finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income','expense')),
  category text,
  amount numeric(12,2) not null check (amount >= 0),
  related_order_id uuid references orders(id) on delete set null,
  related_supplier_id uuid references suppliers(id) on delete set null,
  related_client_id uuid references clients(id) on delete set null,
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index idx_finance_date on finance_transactions(transaction_date);

create table supplier_deliveries (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete restrict,
  raw_material_id uuid not null references raw_materials(id) on delete restrict,
  qty numeric(14,3) not null check (qty > 0),
  unit_price numeric(12,2),
  total_cost numeric(14,2),
  delivery_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index idx_deliveries_supplier on supplier_deliveries(supplier_id);
create index idx_deliveries_material on supplier_deliveries(raw_material_id);

-- ==========================================================================
-- Product code autogeneration (3-digit, sequential)
-- ==========================================================================
create or replace function generate_product_code() returns trigger as $$
begin
  if new.code is null then
    new.code := lpad((
      select coalesce(max(code::int), 0) + 1
      from finished_products
      where code ~ '^[0-9]+$'
    )::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_product_code before insert on finished_products
  for each row execute function generate_product_code();

-- ==========================================================================
-- Product cost recalculation from BOM
-- ==========================================================================
create or replace function recalc_product_cost(p_product_id uuid) returns void as $$
begin
  update finished_products fp set cost_price = (
    select coalesce(sum(pb.qty_per_unit * rm.unit_price), 0)
    from product_bom pb
    join raw_materials rm on rm.id = pb.raw_material_id
    where pb.product_id = p_product_id
  )
  where fp.id = p_product_id;
end;
$$ language plpgsql;

create or replace function trg_recalc_cost_from_bom() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform recalc_product_cost(old.product_id);
    return old;
  else
    perform recalc_product_cost(new.product_id);
    return new;
  end if;
end;
$$ language plpgsql;

create trigger trg_bom_recalc_cost
  after insert or update or delete on product_bom
  for each row execute function trg_recalc_cost_from_bom();

create or replace function trg_recalc_cost_from_material_price() returns trigger as $$
begin
  if new.unit_price is distinct from old.unit_price then
    perform recalc_product_cost(pb.product_id)
    from (select distinct product_id from product_bom where raw_material_id = new.id) pb;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_material_price_recalc
  after update of unit_price on raw_materials
  for each row execute function trg_recalc_cost_from_material_price();

-- ==========================================================================
-- Order creation with atomic raw-material consumption
-- ==========================================================================
create or replace function create_order_with_consumption(
  p_client_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_delivery_date date,
  p_unit_price numeric,
  p_notes text default null
) returns uuid as $$
declare
  v_order_id uuid;
  v_bom record;
begin
  insert into orders (client_id, product_id, quantity, delivery_date, unit_price, status, notes)
  values (p_client_id, p_product_id, p_quantity, p_delivery_date, p_unit_price, 'processing', p_notes)
  returning id into v_order_id;

  for v_bom in
    select raw_material_id, qty_per_unit from product_bom where product_id = p_product_id
  loop
    update raw_materials
      set stock_qty = stock_qty - (v_bom.qty_per_unit * p_quantity)
      where id = v_bom.raw_material_id;

    insert into order_material_consumption (order_id, raw_material_id, qty_consumed)
      values (v_order_id, v_bom.raw_material_id, v_bom.qty_per_unit * p_quantity);
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;

-- ==========================================================================
-- Atomic stock increment helper (used for supplier deliveries)
-- ==========================================================================
create or replace function increment_material_stock(p_material_id uuid, p_qty numeric) returns void as $$
begin
  update raw_materials set stock_qty = stock_qty + p_qty where id = p_material_id;
end;
$$ language plpgsql security definer;

-- ==========================================================================
-- Order status transitions
--   processing/in_progress -> ready   : + finished_products.stock_qty (произведено, лежит на складе)
--   ready -> delivered                : - finished_products.stock_qty (отгружено клиенту)
--   any non-terminal -> cancelled     : возврат сырья (+ откат готовой продукции, если был статус ready)
-- ==========================================================================
create or replace function update_order_status(p_order_id uuid, p_new_status text) returns void as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;
  if v_order.status = p_new_status then
    return;
  end if;
  if v_order.status in ('delivered','cancelled') then
    raise exception 'Order % is already in a terminal status (%)', p_order_id, v_order.status;
  end if;

  if p_new_status = 'ready' and v_order.status != 'ready' then
    update finished_products set stock_qty = stock_qty + v_order.quantity where id = v_order.product_id;
  elsif p_new_status = 'delivered' and v_order.status = 'ready' then
    update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;
  elsif p_new_status = 'delivered' and v_order.status != 'ready' then
    -- allow skipping straight to delivered: goods enter and leave the warehouse in the same step
    update finished_products set stock_qty = stock_qty + v_order.quantity - v_order.quantity where id = v_order.product_id;
  elsif p_new_status = 'cancelled' then
    update raw_materials rm
      set stock_qty = rm.stock_qty + omc.qty_consumed
      from order_material_consumption omc
      where omc.order_id = p_order_id and omc.raw_material_id = rm.id;

    if v_order.status = 'ready' then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;
    end if;
  end if;

  update orders set status = p_new_status where id = p_order_id;
end;
$$ language plpgsql security definer;

-- ==========================================================================
-- Dashboard aggregates
-- ==========================================================================
create or replace function dashboard_kpi(p_from date, p_to date)
returns table (
  produced_qty numeric,
  orders_count int,
  active_orders int,
  revenue numeric,
  shortage_materials_count int
) language sql as $$
  select
    coalesce((select sum(o.quantity) from orders o
      where o.status = 'delivered' and o.created_at::date between p_from and p_to), 0),
    (select count(*) from orders o where o.created_at::date between p_from and p_to),
    (select count(*) from orders o
      where o.status in ('processing','in_progress','ready')
        and o.created_at::date between p_from and p_to),
    coalesce((select sum(o.total_amount) from orders o
      where o.status = 'delivered' and o.created_at::date between p_from and p_to), 0),
    (select count(*) from raw_materials where stock_qty < 0);
$$;

create view v_material_shortage as
  select id, code, name, unit, stock_qty,
         (stock_qty < 0) as is_short,
         greatest(-stock_qty, 0) as shortage_qty
  from raw_materials
  order by shortage_qty desc, name asc;

create view v_production_trend as
  select date_trunc('day', o.created_at)::date as day, sum(o.quantity) as produced_qty
  from orders o
  where o.status = 'delivered'
  group by 1
  order by 1;

-- ==========================================================================
-- Row Level Security — open policies (no login by product decision)
-- ==========================================================================
alter table clients enable row level security;
alter table suppliers enable row level security;
alter table raw_materials enable row level security;
alter table finished_products enable row level security;
alter table product_bom enable row level security;
alter table orders enable row level security;
alter table order_material_consumption enable row level security;
alter table finance_transactions enable row level security;
alter table supplier_deliveries enable row level security;

create policy "public_all_clients" on clients for all using (true) with check (true);
create policy "public_all_suppliers" on suppliers for all using (true) with check (true);
create policy "public_all_raw_materials" on raw_materials for all using (true) with check (true);
create policy "public_all_finished_products" on finished_products for all using (true) with check (true);
create policy "public_all_product_bom" on product_bom for all using (true) with check (true);
create policy "public_all_orders" on orders for all using (true) with check (true);
create policy "public_all_omc" on order_material_consumption for all using (true) with check (true);
create policy "public_all_finance" on finance_transactions for all using (true) with check (true);
create policy "public_all_deliveries" on supplier_deliveries for all using (true) with check (true);

-- ==========================================================================
-- Storage bucket for photos
-- ==========================================================================
insert into storage.buckets (id, name, public)
  values ('enzopack-media', 'enzopack-media', true)
  on conflict (id) do nothing;

create policy "public_read_media" on storage.objects for select
  using (bucket_id = 'enzopack-media');
create policy "public_write_media" on storage.objects for insert
  with check (bucket_id = 'enzopack-media');
create policy "public_update_media" on storage.objects for update
  using (bucket_id = 'enzopack-media');
create policy "public_delete_media" on storage.objects for delete
  using (bucket_id = 'enzopack-media');
