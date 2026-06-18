-- ============================================================
-- MANZIL – Complete Database Setup
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TRIPS & ITINERARY DAYS
-- ─────────────────────────────────────────────
create table if not exists public.trips (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  source               text,
  destination          text not null,
  days                 integer not null,
  budget               numeric not null,
  total_estimated_cost numeric not null default 0,
  interests            text[] not null default '{}',
  created_at           timestamptz not null default now()
);

create table if not exists public.itinerary_days (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references public.trips(id) on delete cascade,
  day_number     integer not null,
  title          text not null,
  location       text not null,
  description    text not null,
  start_time     text not null,
  estimated_cost numeric not null default 0,
  activities     jsonb default '[]',
  created_at     timestamptz not null default now()
);

alter table public.itinerary_days
  add column if not exists activities jsonb default '[]';

create index if not exists itinerary_days_trip_id_idx on public.itinerary_days(trip_id);
create index if not exists trips_user_id_idx on public.trips(user_id);

alter table public.trips enable row level security;
alter table public.itinerary_days enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='trips' and policyname='Users can view own trips'
  ) then
    create policy "Users can view own trips"
      on public.trips for select using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='trips' and policyname='Users can insert own trips'
  ) then
    create policy "Users can insert own trips"
      on public.trips for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='trips' and policyname='Users can update own trips'
  ) then
    create policy "Users can update own trips"
      on public.trips for update using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='trips' and policyname='Users can delete own trips'
  ) then
    create policy "Users can delete own trips"
      on public.trips for delete using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='itinerary_days' and policyname='Users can view own itinerary days'
  ) then
    create policy "Users can view own itinerary days"
      on public.itinerary_days for select
      using (exists (
        select 1 from public.trips
        where trips.id = itinerary_days.trip_id
          and trips.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='itinerary_days' and policyname='Users can insert own itinerary days'
  ) then
    create policy "Users can insert own itinerary days"
      on public.itinerary_days for insert
      with check (exists (
        select 1 from public.trips
        where trips.id = itinerary_days.trip_id
          and trips.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='itinerary_days' and policyname='Users can update own itinerary days'
  ) then
    create policy "Users can update own itinerary days"
      on public.itinerary_days for update
      using (exists (
        select 1 from public.trips
        where trips.id = itinerary_days.trip_id
          and trips.user_id = auth.uid()
      ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='itinerary_days' and policyname='Users can delete own itinerary days'
  ) then
    create policy "Users can delete own itinerary days"
      on public.itinerary_days for delete
      using (exists (
        select 1 from public.trips
        where trips.id = itinerary_days.trip_id
          and trips.user_id = auth.uid()
      ));
  end if;
end $$;


-- ─────────────────────────────────────────────
-- 2. CHAT MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_idx  on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='chat_messages' and policyname='Users can view own chat messages'
  ) then
    create policy "Users can view own chat messages"
      on public.chat_messages for select using (auth.uid() = user_id);
  end if;
end $$;


-- ─────────────────────────────────────────────
-- 3. EXPENSES
-- ─────────────────────────────────────────────
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null,
  description  text,
  amount       numeric not null check (amount >= 0),
  expense_date date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists expenses_user_id_idx    on public.expenses(user_id);
create index if not exists expenses_date_idx       on public.expenses(expense_date);

alter table public.expenses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='expenses' and policyname='Users can view own expenses') then
    create policy "Users can view own expenses"   on public.expenses for select using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='expenses' and policyname='Users can insert own expenses') then
    create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='expenses' and policyname='Users can update own expenses') then
    create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='expenses' and policyname='Users can delete own expenses') then
    create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- 4. FAVORITES
-- ─────────────────────────────────────────────
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('destination','hotel','restaurant','activity')),
  title       text not null,
  location    text,
  image_url   text,
  rating      numeric(3,1),
  price       numeric(12,2),
  description text,
  created_at  timestamptz default now()
);

alter table public.favorites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='favorites' and policyname='Users can view own favorites') then
    create policy "Users can view own favorites"   on public.favorites for select using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='favorites' and policyname='Users can insert own favorites') then
    create policy "Users can insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='favorites' and policyname='Users can delete own favorites') then
    create policy "Users can delete own favorites" on public.favorites for delete using (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='favorites' and policyname='Users can update own favorites') then
    create policy "Users can update own favorites" on public.favorites for update using (auth.uid() = user_id);
  end if;
end $$;

-- ============================================================
-- DONE — All 4 tables created with RLS policies.
-- Now go to: Authentication → Providers → Email
-- and toggle OFF "Confirm email" to allow instant sign-ups.
-- ============================================================
