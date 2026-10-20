-- Task 17: Google Calendar import (read-only) — connections + work_items external ids for dedupe.
-- OAuth tokens are stored as plain text for MVP; encrypt at rest (pgcrypto / envelope) before production.

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_connections_provider_check check (provider in ('google')),
  constraint calendar_connections_workspace_space_unique unique (workspace_id, space_id)
);

create index if not exists calendar_connections_workspace_idx
  on public.calendar_connections (workspace_id);

alter table public.work_items
  add column if not exists external_provider text;

alter table public.work_items
  add column if not exists external_id text;

create unique index if not exists work_items_workspace_external_uidx
  on public.work_items (workspace_id, external_provider, external_id)
  where external_id is not null and external_provider is not null;

alter table public.calendar_connections enable row level security;

create policy calendar_connections_owner on public.calendar_connections for all to authenticated
  using (public.is_workspace_owner (workspace_id))
  with check (public.is_workspace_owner (workspace_id));
