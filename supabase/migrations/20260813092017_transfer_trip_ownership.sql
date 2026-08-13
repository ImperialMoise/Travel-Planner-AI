create or replace function public.transfer_trip_ownership(
  p_trip_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  target_user_id uuid;
begin
  current_user_id := (
    select auth.uid()
  );

  if current_user_id is null then
    raise exception 'Connexion requise';
  end if;

  perform 1
  from public.trips t
  where t.id = p_trip_id
    and t.owner_id = current_user_id
  for update;

  if not found then
    raise exception 'Seul le propriétaire peut transférer ce voyage';
  end if;

  select m.user_id
  into target_user_id
  from public.trip_members m
  where m.id = p_member_id
    and m.trip_id = p_trip_id
    and m.role in (
      'editor',
      'viewer'
    )
  for update;

  if not found then
    raise exception 'Membre destinataire introuvable';
  end if;

  update public.trip_members
  set role = 'editor'
  where trip_id = p_trip_id
    and user_id = current_user_id
    and role = 'owner';

  if not found then
    raise exception 'Membre propriétaire introuvable';
  end if;

  update public.trip_members
  set role = 'owner'
  where id = p_member_id;

  update public.trips
  set owner_id = target_user_id
  where id = p_trip_id
    and owner_id = current_user_id;
end;
$$;

revoke execute
on function public.transfer_trip_ownership(uuid, uuid)
from public, anon;

grant execute
on function public.transfer_trip_ownership(uuid, uuid)
to authenticated;