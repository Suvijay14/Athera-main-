-- Distinct workspace element kinds (note, reminder, list, checklist, database/space).
-- Brain-dump onboarding needs work_items.element_kind only.
-- page_kind requires public.pages from supabase/migrations/20261014180000_notes_pages.sql —
-- run that file in the SQL editor first if it is missing.

alter table public.work_items
  add column if not exists element_kind text not null default 'task';

alter table public.work_items drop constraint if exists work_items_element_kind_check;
alter table public.work_items
  add constraint work_items_element_kind_check
  check (element_kind in ('task', 'event', 'reminder', 'note'));

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'pages'
  ) then
    alter table public.pages
      add column if not exists page_kind text not null default 'notes';

    alter table public.pages drop constraint if exists pages_page_kind_check;
    alter table public.pages
      add constraint pages_page_kind_check
      check (page_kind in ('notes', 'checklist', 'quick_note'));
  end if;
end $$;

create table if not exists public.workspace_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint workspace_lists_name_nonempty check (length(btrim(name)) > 0)
);

create index if not exists workspace_lists_workspace_space_idx
  on public.workspace_lists (workspace_id, space_id, created_at desc);

create table if not exists public.workspace_list_items (
  list_id uuid not null references public.workspace_lists (id) on delete cascade,
  work_item_id uuid not null references public.work_items (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (list_id, work_item_id)
);

create index if not exists workspace_list_items_list_order_idx
  on public.workspace_list_items (list_id, sort_order);

alter table public.workspace_lists enable row level security;
alter table public.workspace_list_items enable row level security;

drop policy if exists workspace_lists_owner on public.workspace_lists;
create policy workspace_lists_owner on public.workspace_lists for all to authenticated
  using (public.is_workspace_owner (workspace_id))
  with check (public.is_workspace_owner (workspace_id));

drop policy if exists workspace_list_items_owner on public.workspace_list_items;
create policy workspace_list_items_owner on public.workspace_list_items for all to authenticated
  using (
    exists (
      select 1 from public.workspace_lists l
      where l.id = list_id and public.is_workspace_owner (l.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.workspace_lists l
      where l.id = list_id and public.is_workspace_owner (l.workspace_id)
    )
  );

grant select, insert, update, delete on public.workspace_lists to authenticated;
grant select, insert, update, delete on public.workspace_list_items to authenticated;
