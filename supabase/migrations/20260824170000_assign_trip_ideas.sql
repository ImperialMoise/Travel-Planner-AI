alter table public.trip_ideas
add column if not exists assigned_to uuid
references public.profiles(id)
on delete set null;

grant update (
  assigned_to
)
on table public.trip_ideas
to authenticated;

create index if not exists trip_ideas_assigned_to_idx
on public.trip_ideas (
  trip_id,
  assigned_to
)
where assigned_to is not null;