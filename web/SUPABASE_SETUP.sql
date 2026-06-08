-- ════════════════════════════════════════════════════════════
-- SETUP COMPLET — Nouveau projet Supabase pour Voyage Planner
-- À exécuter dans Supabase → SQL Editor → New query
-- Ordre : tables → triggers → RLS policies.
-- ════════════════════════════════════════════════════════════

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Tables ────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date,
  owner_id    uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists trip_members (
  id        uuid primary key default gen_random_uuid(),
  trip_id   uuid not null references trips(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      text not null check (role in ('owner','editor','viewer')) default 'editor',
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

create table if not exists trip_days (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  day_index   integer not null,
  title       text default '',
  note        text default '',
  date_label  text default '',
  date_iso    date,
  updated_at  timestamptz default now(),
  unique(trip_id, day_index)
);

create table if not exists trip_steps (
  id              uuid primary key default gen_random_uuid(),
  day_id          uuid not null references trip_days(id) on delete cascade,
  trip_id         uuid not null references trips(id) on delete cascade,
  step_index      integer not null default 0,
  type            text not null default 'autre',
  label           text default '',
  lieu            text default '',
  time            text default '',
  time_end        text default '',
  transport_type  text default '',
  depart          text default '',
  arrivee         text default '',
  duree           text default '',
  next_day        boolean default false,
  escales         jsonb default '[]',
  ref             text default '',
  date_start      date,
  date_end        date,
  nuits           integer default 0,
  time_check_in   text default '15:00',
  time_check_out  text default '11:00',
  duree_estimee   text default '',
  link            text default '',
  note            text default '',
  amount          numeric(10,2) default 0,
  paid_by         text default '',
  created_by      uuid references profiles(id),
  updated_at      timestamptz default now()
);

create table if not exists trip_invites (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  role        text not null check (role in ('editor','viewer')) default 'editor',
  created_by  uuid references profiles(id),
  expires_at  timestamptz default now() + interval '7 days',
  used_by     uuid references profiles(id),
  used_at     timestamptz,
  created_at  timestamptz default now()
);

-- ─── Triggers ──────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trips_updated_at on trips;
create trigger trips_updated_at before update on trips
  for each row execute function set_updated_at();
drop trigger if exists trip_days_updated_at on trip_days;
create trigger trip_days_updated_at before update on trip_days
  for each row execute function set_updated_at();
drop trigger if exists trip_steps_updated_at on trip_steps;
create trigger trip_steps_updated_at before update on trip_steps
  for each row execute function set_updated_at();

-- Auto-création du profil à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles(id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Owner ajouté comme membre automatiquement
create or replace function add_owner_as_member()
returns trigger as $$
begin
  insert into trip_members(trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trip_after_insert on trips;
create trigger trip_after_insert after insert on trips
  for each row execute function add_owner_as_member();

-- ─── RLS ───────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table trips         enable row level security;
alter table trip_members  enable row level security;
alter table trip_days     enable row level security;
alter table trip_steps    enable row level security;
alter table trip_invites  enable row level security;

-- profiles : visible à soi et aux co-membres
drop policy if exists "self_or_co_member" on profiles;
create policy "self_or_co_member" on profiles
  for select using (
    id = auth.uid() or
    id in (select user_id from trip_members
           where trip_id in (select trip_id from trip_members where user_id = auth.uid()))
  );
drop policy if exists "self_update" on profiles;
create policy "self_update" on profiles
  for update using (id = auth.uid());

-- trips : owner ou membre
drop policy if exists "insert_trip" on trips;
create policy "insert_trip" on trips
  for insert with check (owner_id = auth.uid());
drop policy if exists "select_trip" on trips;
create policy "select_trip" on trips
  for select using (
    owner_id = auth.uid()
    or id in (select trip_id from trip_members where user_id = auth.uid())
  );
drop policy if exists "update_trip" on trips;
create policy "update_trip" on trips
  for update using (owner_id = auth.uid());
drop policy if exists "delete_trip" on trips;
create policy "delete_trip" on trips
  for delete using (owner_id = auth.uid());

-- trip_members
drop policy if exists "select_members" on trip_members;
create policy "select_members" on trip_members
  for select using (user_id = auth.uid());
drop policy if exists "insert_member" on trip_members;
create policy "insert_member" on trip_members
  for insert with check (true);

-- trip_days
drop policy if exists "select_days" on trip_days;
create policy "select_days" on trip_days
  for select using (
    trip_id in (select trip_id from trip_members where user_id = auth.uid())
  );
drop policy if exists "modify_days" on trip_days;
create policy "modify_days" on trip_days
  for all using (
    trip_id in (select trip_id from trip_members where user_id = auth.uid() and role in ('owner','editor'))
  );

-- trip_steps
drop policy if exists "select_steps" on trip_steps;
create policy "select_steps" on trip_steps
  for select using (
    trip_id in (select trip_id from trip_members where user_id = auth.uid())
  );
drop policy if exists "modify_steps" on trip_steps;
create policy "modify_steps" on trip_steps
  for all using (
    trip_id in (select trip_id from trip_members where user_id = auth.uid() and role in ('owner','editor'))
  );

-- trip_invites
drop policy if exists "select_invite" on trip_invites;
create policy "select_invite" on trip_invites
  for select using (true);
drop policy if exists "insert_invite" on trip_invites;
create policy "insert_invite" on trip_invites
  for insert with check (
    exists (select 1 from trips where trips.id = trip_invites.trip_id and trips.owner_id = auth.uid())
  );
drop policy if exists "update_invite" on trip_invites;
create policy "update_invite" on trip_invites
  for update using (true);

-- ─── Realtime ──────────────────────────────────────────────
-- Activer la publication realtime pour les tables qu'on écoute
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table trip_days;
alter publication supabase_realtime add table trip_steps;
