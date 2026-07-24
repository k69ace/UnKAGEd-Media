-- chef_review_required (organization_settings) has existed since the
-- config-tables migration but was never enforceable: there was no
-- per-estimate record of whether a chef had actually reviewed it. Adds
-- that record and teaches the audit trigger to log it, so the
-- application layer (changeEstimateStatus) can gate Send on it when the
-- org has opted in.

alter table catering_estimates
  add column chef_reviewed_at timestamptz,
  add column chef_reviewed_by uuid references profiles(id) on delete set null;

create or replace function log_estimate_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into audit_log (organization_id, entity_type, entity_id, action, actor_id, changes)
    values (
      new.organization_id,
      'catering_estimate',
      new.id,
      case when tg_op = 'INSERT' then 'created' else 'status_changed' end,
      new.updated_by,
      jsonb_build_object(
        'from_status', case when tg_op = 'INSERT' then null else old.status end,
        'to_status', new.status
      )
    );
  end if;

  if tg_op = 'UPDATE' and old.status in ('approved', 'won')
     and (
       new.discount_amount is distinct from old.discount_amount
       or new.guest_count_guaranteed is distinct from old.guest_count_guaranteed
       or new.deposit_amount is distinct from old.deposit_amount
     ) then
    insert into audit_log (organization_id, entity_type, entity_id, action, actor_id, changes)
    values (
      new.organization_id,
      'catering_estimate',
      new.id,
      'post_approval_edit',
      new.updated_by,
      jsonb_build_object(
        'discount_amount', jsonb_build_object('from', old.discount_amount, 'to', new.discount_amount),
        'guest_count_guaranteed', jsonb_build_object('from', old.guest_count_guaranteed, 'to', new.guest_count_guaranteed),
        'deposit_amount', jsonb_build_object('from', old.deposit_amount, 'to', new.deposit_amount)
      )
    );
  end if;

  -- Feasibility review: logged separately from a generic field-change so
  -- it shows up in the Activity Log with its own clear label, distinct
  -- from post_approval_edit (which only fires after approval anyway --
  -- chef review always happens before Send, i.e. while still a draft).
  if tg_op = 'UPDATE' and old.chef_reviewed_at is null and new.chef_reviewed_at is not null then
    insert into audit_log (organization_id, entity_type, entity_id, action, actor_id, changes)
    values (
      new.organization_id,
      'catering_estimate',
      new.id,
      'chef_reviewed',
      new.chef_reviewed_by,
      null
    );
  end if;

  return new;
end;
$$;
