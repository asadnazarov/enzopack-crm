-- Seeds two "virtual" raw materials representing the calculator's glue types,
-- so glue consumption is also deducted from stock through the existing
-- create_order_with_consumption mechanism (via product_bom), instead of
-- needing a separate glue-specific stock model.

insert into raw_materials (name, unit, unit_price, stock_qty)
  select 'Клей крахмальный (авто)', 'кг', 0, 0
  where not exists (select 1 from raw_materials where name = 'Клей крахмальный (авто)');

insert into raw_materials (name, unit, unit_price, stock_qty)
  select 'Клей жидкое стекло (авто)', 'кг', 0, 0
  where not exists (select 1 from raw_materials where name = 'Клей жидкое стекло (авто)');
