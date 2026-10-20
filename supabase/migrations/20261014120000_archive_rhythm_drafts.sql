-- Task 13: drafts, entity opt-out, work item archive/completed for rhythm + archive flow.

alter table public.entities
  add column if not exists excluded_from_suggestions boolean not null default false;

alter table public.work_items
  add column if not exists archived_at timestamptz;

alter table public.work_items
  add column if not exists completed_at timestamptz;

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  entity_id uuid not null references public.entities (id) on delete cascade,
  suggestion_id uuid references public.suggestions (id) on delete set null,
  channel text not null,
  body text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drafts_channel_check check (channel in ('email', 'text')),
  constraint drafts_status_check check (status in ('draft', 'copied', 'dismissed'))
);

create index if not exists drafts_workspace_entity_created_idx
  on public.drafts (workspace_id, entity_id, created_at desc);

alter table public.drafts enable row level security;
alter table public.drafts force row level security;

drop policy if exists drafts_owner on public.drafts;
create policy drafts_owner on public.drafts
  for all to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

revoke all on public.drafts from anon;
grant select, insert, update, delete on public.drafts to authenticated;
