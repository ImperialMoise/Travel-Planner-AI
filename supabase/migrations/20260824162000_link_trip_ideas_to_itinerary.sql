alter table public.trip_ideas
add column if not exists planned_day_id uuid
references public.trip_days(id)
on delete set null;

alter table public.trip_ideas
add column if not exists planned_step_id uuid
references public.trip_steps(id)
on delete set null;

grant update (
  status,
  planned_day_id,
  planned_step_id
)
on table public.trip_ideas
to authenticated;

create index if not exists trip_ideas_planned_day_idx
on public.trip_ideas (
  trip_id,
  planned_day_id
)
where planned_day_id is not null;

create index if not exists trip_ideas_planned_step_idx
on public.trip_ideas (
  trip_id,
  planned_step_id
)
where planned_step_id is not null;