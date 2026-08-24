create table if not exists public.trip_idea_votes (
  idea_id uuid not null
    references public.trip_ideas(id)
    on delete cascade,

  user_id uuid not null
    default auth.uid()
    references public.profiles(id)
    on delete cascade,

  created_at timestamp with time zone
    not null default now(),

  primary key (
    idea_id,
    user_id
  )
);

create index if not exists trip_idea_votes_user_idx
on public.trip_idea_votes (
  user_id,
  created_at desc
);

alter table public.trip_idea_votes
enable row level security;

revoke all
on table public.trip_idea_votes
from anon;

revoke all
on table public.trip_idea_votes
from authenticated;

grant select, insert, delete
on table public.trip_idea_votes
to authenticated;

grant select, insert, update, delete
on table public.trip_idea_votes
to service_role;

drop policy if exists trip_idea_votes_select_member
on public.trip_idea_votes;

create policy trip_idea_votes_select_member
on public.trip_idea_votes
for select
to authenticated
using (
  exists (
    select 1
    from public.trip_ideas idea
    where idea.id =
      trip_idea_votes.idea_id
      and (
        select public.is_trip_member(
          idea.trip_id
        )
      )
  )
);

drop policy if exists trip_idea_votes_insert_member
on public.trip_idea_votes;

create policy trip_idea_votes_insert_member
on public.trip_idea_votes
for insert
to authenticated
with check (
  user_id = (
    select auth.uid()
  )
  and exists (
    select 1
    from public.trip_ideas idea
    where idea.id =
      trip_idea_votes.idea_id
      and (
        select public.is_trip_member(
          idea.trip_id
        )
      )
  )
);

drop policy if exists trip_idea_votes_delete_own
on public.trip_idea_votes;

create policy trip_idea_votes_delete_own
on public.trip_idea_votes
for delete
to authenticated
using (
  user_id = (
    select auth.uid()
  )
  and exists (
    select 1
    from public.trip_ideas idea
    where idea.id =
      trip_idea_votes.idea_id
      and (
        select public.is_trip_member(
          idea.trip_id
        )
      )
  )
);