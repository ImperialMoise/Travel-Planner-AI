create table public.trip_ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null
    references public.trips(id)
    on delete cascade,
  title text not null,
  note text not null default '',
  link text not null default '',
  sort_index integer not null default 0,
  created_by uuid not null
    references public.profiles(id)
    on delete cascade,
  created_at timestamp with time zone
    not null default now(),
  updated_at timestamp with time zone
    not null default now(),

  constraint trip_ideas_title_length_check
    check (
      char_length(btrim(title))
      between 1 and 160
    ),

  constraint trip_ideas_note_length_check
    check (
      char_length(note) <= 2000
    ),

  constraint trip_ideas_link_length_check
    check (
      char_length(link) <= 2048
    ),

  constraint trip_ideas_sort_index_check
    check (
      sort_index >= 0
    )
);

create index trip_ideas_trip_created_idx
  on public.trip_ideas (
    trip_id,
    created_at desc
  );

create index trip_ideas_created_by_idx
  on public.trip_ideas (
    created_by
  );

alter table public.trip_ideas
  enable row level security;

revoke all
  on table public.trip_ideas
  from anon;

revoke all
  on table public.trip_ideas
  from authenticated;

grant select, insert, delete
  on table public.trip_ideas
  to authenticated;

grant update (
  title,
  note,
  link,
  sort_index
)
  on table public.trip_ideas
  to authenticated;

grant select, insert, update, delete
  on table public.trip_ideas
  to service_role;

create policy trip_ideas_select_member
  on public.trip_ideas
  for select
  to authenticated
  using (
    (
      select public.is_trip_member(
        trip_ideas.trip_id
      )
    )
  );

create policy trip_ideas_insert_editor
  on public.trip_ideas
  for insert
  to authenticated
  with check (
    (
      select public.can_edit_trip(
        trip_ideas.trip_id
      )
    )
    and created_by = (
      select auth.uid()
    )
  );

create policy trip_ideas_update_editor
  on public.trip_ideas
  for update
  to authenticated
  using (
    (
      select public.can_edit_trip(
        trip_ideas.trip_id
      )
    )
  )
  with check (
    (
      select public.can_edit_trip(
        trip_ideas.trip_id
      )
    )
  );

create policy trip_ideas_delete_editor
  on public.trip_ideas
  for delete
  to authenticated
  using (
    (
      select public.can_edit_trip(
        trip_ideas.trip_id
      )
    )
  );

create trigger trip_ideas_updated_at
  before update
  on public.trip_ideas
  for each row
  execute function public.set_updated_at();