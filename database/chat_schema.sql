-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Stores the AI Assistant's conversation history per user. Writes go
-- through the FastAPI backend's service-role client (it needs to insert
-- both "user" and "assistant" rows), so only a read policy is defined here.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);
