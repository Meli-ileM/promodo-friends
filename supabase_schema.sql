-- Execute this in Supabase SQL Editor

create table if not exists public.rooms (
  id text primary key,
  nom text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.users_status (
  id uuid primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  pseudo text not null,
  status text not null default 'idle',
  time_left integer not null default 1500,
  points integer not null default 0,
  task text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_status_room_updated
  on public.users_status(room_id, updated_at desc);

alter table public.rooms enable row level security;
alter table public.users_status enable row level security;

-- Demo-friendly policies (public read/write with anon key).
-- If needed, harden later with auth-based policies.
drop policy if exists rooms_select_all on public.rooms;
create policy rooms_select_all on public.rooms
  for select using (true);

drop policy if exists rooms_insert_all on public.rooms;
create policy rooms_insert_all on public.rooms
  for insert with check (true);

drop policy if exists users_status_select_all on public.users_status;
create policy users_status_select_all on public.users_status
  for select using (true);

drop policy if exists users_status_insert_all on public.users_status;
create policy users_status_insert_all on public.users_status
  for insert with check (true);

drop policy if exists users_status_update_all on public.users_status;
create policy users_status_update_all on public.users_status
  for update using (true) with check (true);
