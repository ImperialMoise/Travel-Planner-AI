drop policy if exists "delete_invite"
on public.trip_invites;

create policy "delete_invite"
on public.trip_invites
for delete
to authenticated
using (
  (
    select public.is_trip_owner(
      trip_id
    )
  )
);