-- Harden set_updated_at(): pin search_path to avoid search_path injection
-- (Supabase security advisor lint 0011). now() lives in pg_catalog so an empty
-- search_path is safe.
create or replace function set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;
