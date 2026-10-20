-- Task 16: space/entity notes pages + version history + note entity extractions.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_type text not null,
  owner_id uuid not null,
  body jsonb not null default '{}'::jsonb,
  body_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_owner_type_check check (owner_type in ('space', 'entity', 'doc')),
  constraint pages_workspace_owner_unique unique (workspace_id, owner_type, owner_id)
);

create index if not exists pages_workspace_owner_idx
  on public.pages (workspace_id, owner_type, owner_id);

create table if not exists public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  body jsonb not null,
  body_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists page_versions_page_created_idx
  on public.page_versions (page_id, created_at desc);

create table if not exists public.page_entity_extractions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  page_id uuid not null references public.pages (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  kind text not null,
  matches_existing_id uuid references public.entities (id) on delete set null,
  confidence numeric not null,
  created_at timestamptz not null default now(),
  constraint page_entity_extractions_confidence_range check (confidence >= 0 and confidence <= 1)
);

create index if not exists page_entity_extractions_page_idx
  on public.page_entity_extractions (workspace_id, page_id, created_at desc);

alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.page_entity_extractions enable row level security;

create policy pages_owner on public.pages for all to authenticated
  using (public.is_workspace_owner (workspace_id))
  with check (public.is_workspace_owner (workspace_id));

create policy page_versions_owner on public.page_versions for all to authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_id and public.is_workspace_owner (p.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.pages p
      where p.id = page_id and public.is_workspace_owner (p.workspace_id)
    )
  );

create policy page_entity_extractions_owner on public.page_entity_extractions for all to authenticated
  using (public.is_workspace_owner (workspace_id))
  with check (public.is_workspace_owner (workspace_id));

grant select, insert, update, delete on public.pages to authenticated;
grant select, insert, update, delete on public.page_versions to authenticated;
grant select, insert, update, delete on public.page_entity_extractions to authenticated;
