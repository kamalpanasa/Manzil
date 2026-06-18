-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text,
  destination text not null,
  days integer not null,
  budget numeric not null,
  total_estimated_cost numeric not null default 0,
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null,
  title text not null,
  location text not null,
  description text not null,
  start_time text not null,
  estimated_cost numeric not null default 0,
  activities jsonb default '[]',
  created_at timestamptz not null default now()
);

-- Add activities column if table already exists (safe to re-run)
alter table public.itinerary_days
  add column if not exists activities jsonb default '[]';

create index if not exists itinerary_days_trip_id_idx on public.itinerary_days(trip_id);
create index if not exists trips_user_id_idx on public.trips(user_id);

alter table public.trips enable row level security;
alter table public.itinerary_days enable row level security;

create policy if not exists "Users can view own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy if not exists "Users can view own itinerary days"
  on public.itinerary_days for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_days.trip_id
      and trips.user_id = auth.uid()
    )
  );
