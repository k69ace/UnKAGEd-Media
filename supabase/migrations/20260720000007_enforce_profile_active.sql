-- profiles.is_active existed from the start but nothing ever checked it:
-- current_organization_id()/current_app_role() looked up a caller's
-- profile unconditionally, so deactivating someone's profile had zero
-- actual effect on their access -- purely cosmetic. Redefining both to
-- require is_active = true makes a deactivated profile fail every RLS
-- policy closed (organization_id/role resolve to null, and every policy
-- in this schema compares against those), not just look deactivated in
-- a UI. `create or replace function` preserves the function's OID, so
-- every policy defined in terms of these two functions (every table
-- created since migration 001) picks up the fix without being redefined.

create or replace function current_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid() and is_active = true;
$$;

create or replace function current_app_role()
returns app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid() and is_active = true;
$$;
