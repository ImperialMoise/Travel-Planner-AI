create or replace function public.log_trip_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_name text;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  select coalesce(
    p.display_name,
    p.email,
    'Un membre'
  )
  into member_name
  from public.profiles p
  where p.id = new.user_id;

  insert into public.trip_activity (
    trip_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    new.trip_id,
    (select auth.uid()),
    'role_changed',
    'trip_members',
    new.id,
    jsonb_build_object(
      'member_name',
      coalesce(
        member_name,
        'Un membre'
      ),
      'member_user_id',
      new.user_id,
      'old_role',
      old.role,
      'new_role',
      new.role
    )
  );

  return new;
end;
$$;

revoke execute
on function public.log_trip_member_role_change()
from public, anon, authenticated;

drop trigger if exists
trip_activity_member_role_changes
on public.trip_members;

create trigger trip_activity_member_role_changes
after update of role
on public.trip_members
for each row
when (old.role is distinct from new.role)
execute function public.log_trip_member_role_change();