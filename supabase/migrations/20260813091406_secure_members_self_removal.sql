drop policy if exists "delete_member"
on public.trip_members;

create policy "delete_member"
on public.trip_members
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and role <> 'owner'
);