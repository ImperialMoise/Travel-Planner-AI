alter table public.trip_ideas
add column if not exists status text not null default 'idea';

update public.trip_ideas
set status = 'idea'
where status is null
   or status not in (
     'idea',
     'planned',
     'booked',
     'done'
   );

alter table public.trip_ideas
drop constraint if exists trip_ideas_status_check;

alter table public.trip_ideas
add constraint trip_ideas_status_check
check (
  status in (
    'idea',
    'planned',
    'booked',
    'done'
  )
);

create index if not exists trip_ideas_trip_status_sort_idx
on public.trip_ideas (
  trip_id,
  status,
  sort_index,
  created_at desc
);