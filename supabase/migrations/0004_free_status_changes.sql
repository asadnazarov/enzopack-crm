-- Allow changing an order's status freely in any direction (including after
-- "delivered"), instead of treating delivered as a frozen terminal state.
-- Finished-goods stock is adjusted based on whether the material is entering
-- or leaving the "ready" (in finished warehouse) state, regardless of
-- direction. Only "cancelled" stays a one-way terminal action.

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
    end if;
  else
    v_was_ready := (v_order.status = 'ready');
    v_will_be_ready := (p_new_status = 'ready');

    if v_was_ready and not v_will_be_ready then
      update finished_products set stock_qty = stock_qty - v_order.quantity where id = v_order.product_id;
    elsif not v_was_ready and v_will_be_ready then
      update finished_products set stock_qty = stock_qty + v_order.quantity where id = v_order.product_id;
    end if;
  end if;

  update orders set status = p_new_status where id = p_order_id;
end;
$$ language plpgsql security definer;
