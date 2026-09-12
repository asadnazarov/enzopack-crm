-- Additive extension of update_order_status: logs every finished_products
-- stock_qty change into finished_goods_movements (a dated ledger), exactly
-- at the same points the function already changes that stock_qty. No
-- existing branch/condition is altered — only insert statements are added.

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
      where omc.order_id = p_order_id and omc.raw_material_id = rm.id;

    if v_order.status = 'ready' then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'adjustment', -v_order.quantity, current_date, 'Отмена заказа после статуса «Готово»');
    end if;
  else
    v_was_ready := (v_order.status = 'ready');
    v_will_be_ready := (p_new_status = 'ready');

    if v_was_ready and not v_will_be_ready then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'shipped', v_order.quantity, current_date, 'Статус: ' || p_new_status);
    elsif not v_was_ready and v_will_be_ready then
      update finished_products set stock_qty = stock_qty + v_order.quantity where id = v_order.product_id;

      insert into finished_goods_movements (product_id, order_id, movement_type, qty, movement_date, notes)
        values (v_order.product_id, p_order_id, 'produced', v_order.quantity, current_date, 'Статус: ready');
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
