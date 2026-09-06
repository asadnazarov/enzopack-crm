-- CRITICAL FIX: recreating schema public (drop/create cascade) during the
-- initial setup wiped Supabase's default privilege grants. RLS policies
-- alone are not enough — Postgres also requires table-level GRANTs for the
-- `anon` role, which were never restored. Every query from the app has been
-- failing with "permission denied for table ..." (42501) as a result.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
