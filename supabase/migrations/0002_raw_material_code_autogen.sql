-- Fix: raw_materials.code is NOT NULL but had no auto-generation trigger,
-- so every insert (from the app) violated the constraint and silently failed.

create or replace function generate_material_code() returns trigger as $$
begin
  if new.code is null then
    new.code := lpad((
      select coalesce(max(code::int), 0) + 1
      from raw_materials
      where code ~ '^[0-9]+$'
    )::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_material_code before insert on raw_materials
  for each row execute function generate_material_code();
