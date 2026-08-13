create or replace function public.update_trip_member_role(
  p_trip_id uuid,
  p_member_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_member public.trip_members%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise';
  end if;

  if not public.is_trip_owner(p_trip_id) then
    raise exception 'Seul le propriétaire peut modifier les rôles';
  end if;

  if p_role is null or p_role not in ('editor', 'viewer') then
    raise exception 'Rôle invalide';
  end if;

  select *
  into selected_member
  from public.trip_members
  where id = p_member_id
    and trip_id = p_trip_id
  for update;

  if not found then
    raise exception 'Membre introuvable';
  end if;

  if selected_member.role = 'owner' then
    raise exception 'Le rôle du propriétaire ne peut pas être modifié';
  end if;

  update public.trip_members
  set role = p_role
  where id = selected_member.id;
end;
$$;

revoke execute
on function public.update_trip_member_role(uuid, uuid, text)
from public, anon;

grant execute
on function public.update_trip_member_role(uuid, uuid, text)
to authenticated;