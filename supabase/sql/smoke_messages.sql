-- Run once in Supabase Dashboard → SQL Editor → Run
-- Dev smoke test table for verifying the anon key from the app.

create table if not exists public.smoke_messages (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.smoke_messages enable row level security;

drop policy if exists "smoke anon insert" on public.smoke_messages;
drop policy if exists "smoke anon select" on public.smoke_messages;

create policy "smoke anon insert"
  on public.smoke_messages
  for insert
  to anon
  with check (true);

create policy "smoke anon select"
  on public.smoke_messages
  for select
  to anon
  using (true);
