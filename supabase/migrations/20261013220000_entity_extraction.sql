-- Task 10: LLM entity extraction cache + per-item extraction rows (candidate entities).

create table if not exists public.llm_cache (
  cache_key text primary key,
  response jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.item_entity_extractions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  kind text not null,
  matches_existing_id uuid references public.entities (id) on delete set null,
  confidence numeric not null,
  created_at timestamptz not null default now(),
  constraint item_entity_extractions_confidence_range check (confidence >= 0 and confidence <= 1)
);

create index if not exists item_entity_extractions_workspace_item_idx
  on public.item_entity_extractions (workspace_id, work_item_id);

create index if not exists item_entity_extractions_space_kind_name_idx
  on public.item_entity_extractions (workspace_id, space_id, kind, name, created_at desc);

alter table public.llm_cache enable row level security;
alter table public.llm_cache force row level security;

alter table public.item_entity_extractions enable row level security;
alter table public.item_entity_extractions force row level security;

drop policy if exists llm_cache_service on public.llm_cache;
create policy llm_cache_service on public.llm_cache for all to service_role using (true) with check (true);

drop policy if exists item_entity_extractions_owner on public.item_entity_extractions;
create policy item_entity_extractions_owner on public.item_entity_extractions for all to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

revoke all on public.llm_cache from anon, authenticated;
revoke all on public.item_entity_extractions from anon;
grant select, insert, update, delete on public.item_entity_extractions to authenticated;
grant all on public.llm_cache to service_role;
