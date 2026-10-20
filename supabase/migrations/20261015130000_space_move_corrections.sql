-- Few-shot space classification examples (titles stay out of events).

create table if not exists public.space_move_corrections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  item_id uuid not null references public.work_items (id) on delete cascade,
  from_space_id uuid not null references public.spaces (id) on delete cascade,
  to_space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists space_move_corrections_workspace_created_idx
  on public.space_move_corrections (workspace_id, created_at desc);

alter table public.space_move_corrections enable row level security;

create policy space_move_corrections_select on public.space_move_corrections
  for select using (public.is_workspace_owner (workspace_id));

create policy space_move_corrections_insert on public.space_move_corrections
  for insert with check (public.is_workspace_owner (workspace_id));
