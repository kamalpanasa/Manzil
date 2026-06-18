-- Favorites Table
-- Run this SQL in your Supabase SQL Editor to enable the Favorites feature.

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('destination', 'hotel', 'restaurant', 'activity')),
  title       text not null,
  location    text,
  image_url   text,
  rating      numeric(3, 1),
  price       numeric(12, 2),
  description text,
  created_at  timestamptz default now()
);

-- Enable Row Level Security
alter table public.favorites enable row level security;

-- Only allow users to see/modify their own favorites
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

create policy "Users can update their own favorites"
  on public.favorites for update
  using (auth.uid() = user_id);
