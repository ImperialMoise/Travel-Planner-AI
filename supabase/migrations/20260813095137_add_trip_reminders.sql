create table public.trip_reminders (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null
    references public.trips(id)
    on delete cascade,
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  completed_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),

  constraint trip_reminders_title_length
    check (
      char_length(btrim(title))
      between 1 and 160
    )
);

create index trip_reminders_user_due_idx
  on public.trip_reminders (
    user_id,
    remind_at
  )
  where completed_at is null;

alter table public.trip_reminders
  enable row level security;

revoke all
  on public.trip_reminders
  from anon;

grant select, insert, update, delete
  on public.trip_reminders
  to authenticated;

create policy "select_own_trip_reminders"
  on public.trip_reminders
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and is_trip_member(trip_id)
  );

create policy "insert_own_trip_reminders"
  on public.trip_reminders
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_trip_member(trip_id)
  );

create policy "update_own_trip_reminders"
  on public.trip_reminders
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and is_trip_member(trip_id)
  )
  with check (
    user_id = (select auth.uid())
    and is_trip_member(trip_id)
  );

create policy "delete_own_trip_reminders"
  on public.trip_reminders
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and is_trip_member(trip_id)
  );