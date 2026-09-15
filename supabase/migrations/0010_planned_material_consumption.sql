-- Calculator-driven orders no longer deduct raw material stock at creation
-- time. Instead, the calculator's computed consumption (layers + glue,
-- merged per raw material) is recorded per-order immediately, and the actual
-- stock deduction is deferred until the order enters production
-- (processing -> in_progress). This lets the order-creation screen show a
-- non-blocking "do we have enough material" hint without ever touching
-- warehouse stock at save time.
--
-- The existing product_bom-driven flow (create_order_with_consumption,
-- called by the manual order form) is untouched — it still deducts stock
-- immediately at order creation, exactly as before.

-- ==========================================================================
-- order_material_consumption.applied — has this row's qty_consumed actually
-- been subtracted from raw_materials.stock_qty yet?
-- Existing rows (all written by create_order_with_consumption, which always
-- deducts immediately) are backfilled to true so cancellation of old orders
-- keeps returning stock exactly as it does today.
-- ==========================================================================
alter table order_material_consumption add column applied boolean not null default false;
update order_material_consumption set applied = true;

-- ==========================================================================
-- create_order_with_planned_consumption — creates the order and records the
-- calculator's per-order material consumption, but does NOT touch
-- raw_materials.stock_qty. p_consumption is a jsonb array of
-- {"raw_material_id": uuid, "qty_consumed": numeric}, already merged by
-- material (one row per raw_material_id) by the calling code.
-- ==========================================================================
create or replace function create_order_with_planned_consumption(
  p_client_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_delivery_date date,
  p_unit_price numeric,
  p_notes text,
  p_consumption jsonb
) returns uuid as $$
declare
  v_order_id uuid;
  v_line jsonb;
begin
  insert into orders (client_id, product_id, quantity, delivery_date, unit_price, status, notes)
  values (p_client_id, p_product_id, p_quantity, p_delivery_date, p_unit_price, 'processing', p_notes)
  returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(coalesce(p_consumption, '[]'::jsonb))
  loop
    insert into order_material_consumption (order_id, raw_material_id, qty_consumed, applied)
      values (
        v_order_id,
        (v_line->>'raw_material_id')::uuid,
        (v_line->>'qty_consumed')::numeric,
        false
      );
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;

-- ==========================================================================
-- update_order_status — same status machine as 0009, plus: the first time an
-- order leaves 'processing' into 'in_progress', apply any still-unapplied
-- planned consumption (subtract from raw_materials.stock_qty, mark applied).
-- Cancellation now only returns stock for rows that were actually applied.
-- ==========================================================================
create or replace function update_order_status(p_order_id uuid, p_new_status text) returns void as $$
declare
  v_order orders%rowtype;
  v_was_ready boolean;
  v_will_be_ready boolean;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;
  if v_order.status = p_new_status then
    return;
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'Order % is cancelled and cannot be changed', p_order_id;
  end if;

  if p_new_status = 'cancelled' then
    update raw_materials rm
      set stock_qty = rm.stock_qty + omc.qty_consumed
      from order_material_consumption omc
      where omc.order_id = p_order_id and omc.raw_material_id = rm.id and omc.applied = true;

    if v_order.status = 'ready' then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'adjustment', -v_order.quantity, now(), 'Отмена заказа после статуса «Готово»');
    end if;
  else
    if v_order.status = 'processing' and p_new_status = 'in_progress' then
      update raw_materials rm
        set stock_qty = rm.stock_qty - omc.qty_consumed
        from order_material_consumption omc
        where omc.order_id = p_order_id and omc.raw_material_id = rm.id and omc.applied = false;

      update order_material_consumption
        set applied = true
        where order_id = p_order_id and applied = false;
    end if;

    v_was_ready := (v_order.status = 'ready');
    v_will_be_ready := (p_new_status = 'ready');

    if v_was_ready and not v_will_be_ready then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'shipped', v_order.quantity, now(), 'Статус: ' || p_new_status);
    elsif not v_was_ready and v_will_be_ready then
      update finished_products set stock_qty = stock_qty + v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'produced', v_order.quantity, now(), 'Статус: ready');
    end if;
  end if;

  if p_new_status = 'delivered' and v_order.status != 'delivered' then
    if not exists (
      select 1 from finance_transactions
      where related_order_id = p_order_id and category = 'order_payment'
    ) then
      insert into finance_transactions (type, category, amount, related_order_id, related_client_id, description, transaction_date)
      values ('income', 'order_payment', v_order.total_amount, p_order_id, v_order.client_id, null, current_date);
    end if;
  elsif v_order.status = 'delivered' and p_new_status != 'delivered' then
    delete from finance_transactions
      where related_order_id = p_order_id and category = 'order_payment';
  end if;

  update orders set status = p_new_status where id = p_order_id;
end;
$$ language plpgsql security definer;
