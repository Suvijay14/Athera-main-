-- Nested spaces: child spaces under a parent (e.g. Clients → Rivera Bakery).

alter table public.spaces
  add column if not exists parent_space_id uuid references public.spaces (id) on delete set null;

create index if not exists spaces_workspace_parent_idx
  on public.spaces (workspace_id, parent_space_id)
  where parent_space_id is not null;

comment on column public.spaces.parent_space_id is
  'When set, this space is nested under the parent in navigation. Items live in leaf or parent spaces.';
