create table if not exists public.trip_idea_comments (
  id uuid primary key
    default gen_random_uuid(),

  idea_id uuid not null
    references public.trip_ideas(id)
    on delete cascade,

  user_id uuid not null
    default auth.uid()
    references public.profiles(id)
    on delete cascade,

  body text not null,

  created_at timestamp with time zone
    not null default now(),

  constraint trip_idea_comments_body_check
    check (
      char_length(btrim(body))
      between 1 and 1000
    )
);

create index if not exists trip_idea_comments_idea_created_idx
on public.trip_idea_comments (
  idea_id,
  created_at
);

create index if not exists trip_idea_comments_user_idx
on public.trip_idea_comments (
  user_id
);

alter table public.trip_idea_comments
enable row level security;

revoke all
on table public.trip_idea_comments
from anon;

revoke all
on table public.trip_idea_comments
from authenticated;

grant select, insert, delete
on table public.trip_idea_comments
to authenticated;

grant select, insert, update, delete
on table public.trip_idea_comments
to service_role;

drop policy if exists trip_idea_comments_select_member
on public.trip_idea_comments;

create policy trip_idea_comments_select_member
on public.trip_idea_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.trip_ideas idea
    where idea.id =
      trip_idea_comments.idea_id
      and (
        select public.is_trip_member(
          idea.trip_id
        )
      )
  )
);

drop policy if exists trip_idea_comments_insert_member
on public.trip_idea_comments;

create policy trip_idea_comments_insert_member
on public.trip_idea_comments
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
      trip_idea_comments.idea_id
      and (
        select public.is_trip_member(
          idea.trip_id
        )
      )
  )
);

drop policy if exists trip_idea_comments_delete_own
on public.trip_idea_comments;

create policy trip_idea_comments_delete_own
on public.trip_idea_comments
for delete
to authenticated
using (
  user_id = (
    select auth.uid()
  )
);