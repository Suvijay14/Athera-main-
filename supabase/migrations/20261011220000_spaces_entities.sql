-- Task 7: spaces, entities, extend work_items / field_definitions / view_definitions (extend in place).

-- ---------------------------------------------------------------------------
-- spaces
-- ---------------------------------------------------------------------------

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists spaces_one_default_per_workspace_idx
  on public.spaces (workspace_id)
  where is_default = true;

create index if not exists spaces_workspace_sort_idx
  on public.spaces (workspace_id, sort_order, created_at);

drop trigger if exists spaces_set_updated_at on public.spaces;
create trigger spaces_set_updated_at
  before update on public.spaces
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entities
-- ---------------------------------------------------------------------------

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  kind text not null,
  name text not null,
  aliases text[] not null default '{}'::text[],
  color text,
  archived_at timestamptz,
  last_activity_at timestamptz,
  typical_gap_days numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_name_nonempty check (length(btrim(name)) > 0)
);

create index if not exists entities_workspace_space_kind_idx
  on public.entities (workspace_id, space_id, kind);

create index if not exists entities_workspace_space_active_idx
  on public.entities (workspace_id, space_id)
  where archived_at is null;

drop trigger if exists entities_set_updated_at on public.entities;
create trigger entities_set_updated_at
  before update on public.entities
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- work_items extensions
-- ---------------------------------------------------------------------------

alter table public.work_items
  add column if not exists space_id uuid references public.spaces (id) on delete restrict;

alter table public.work_items
  add column if not exists start_at timestamptz;

alter table public.work_items
  add column if not exists end_at timestamptz;

alter table public.work_items
  add column if not exists all_day boolean not null default false;

alter table public.work_items
  add column if not exists source text not null default 'manual';

alter table public.work_items
  add column if not exists space_confidence numeric;

alter table public.work_items drop constraint if exists work_items_source_check;
alter table public.work_items
  add constraint work_items_source_check
  check (source in ('manual', 'import', 'recurrence', 'routine'));

create index if not exists work_items_workspace_space_created_idx
  on public.work_items (workspace_id, space_id, created_at desc);

-- Default space per workspace + backfill (atomic with schema change intent)
insert into public.spaces (workspace_id, name, is_default, sort_order)
select w.id, 'My space', true, 0
from public.workspaces w
where not exists (
  select 1 from public.spaces s where s.workspace_id = w.id and s.is_default = true
);

update public.work_items wi
set space_id = s.id
from public.spaces s
where s.workspace_id = wi.workspace_id
  and s.is_default = true
  and wi.space_id is null;

alter table public.work_items
  alter column space_id set not null;

-- ---------------------------------------------------------------------------
-- field_definitions extensions
-- ---------------------------------------------------------------------------

alter table public.field_definitions
  add column if not exists entity_kind text;

alter table public.field_definitions drop constraint if exists field_definitions_type_check;
alter table public.field_definitions
  add constraint field_definitions_type_check
  check (type in ('text', 'number', 'date', 'select', 'checkbox', 'entity'));

alter table public.field_definitions drop constraint if exists field_definitions_entity_kind_check;
alter table public.field_definitions
  add constraint field_definitions_entity_kind_check
  check (type <> 'entity' or entity_kind is not null);

-- ---------------------------------------------------------------------------
-- view_definitions extensions
-- ---------------------------------------------------------------------------

alter table public.view_definitions
  add column if not exists color_by_field text;

alter table public.view_definitions
  add column if not exists calendar_range text;

alter table public.view_definitions drop constraint if exists view_definitions_type_check;
alter table public.view_definitions
  add constraint view_definitions_type_check
  check (type in ('list', 'grouped', 'board', 'calendar'));

alter table public.view_definitions drop constraint if exists view_definitions_calendar_range_check;
alter table public.view_definitions
  add constraint view_definitions_calendar_range_check
  check (calendar_range is null or calendar_range in ('week', 'month'));

alter table public.view_definitions drop constraint if exists view_definitions_group_by_required_check;
alter table public.view_definitions
  add constraint view_definitions_group_by_required_check
  check (type in ('list', 'calendar') or group_by_field is not null);

-- ---------------------------------------------------------------------------
-- RLS: spaces
-- ---------------------------------------------------------------------------

alter table public.spaces enable row level security;
alter table public.spaces force row level security;

drop policy if exists spaces_select_authenticated on public.spaces;
create policy spaces_select_authenticated
  on public.spaces for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists spaces_insert_authenticated on public.spaces;
create policy spaces_insert_authenticated
  on public.spaces for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists spaces_update_authenticated on public.spaces;
create policy spaces_update_authenticated
  on public.spaces for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists spaces_delete_authenticated on public.spaces;
create policy spaces_delete_authenticated
  on public.spaces for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- ---------------------------------------------------------------------------
-- RLS: entities
-- ---------------------------------------------------------------------------

alter table public.entities enable row level security;
alter table public.entities force row level security;

drop policy if exists entities_select_authenticated on public.entities;
create policy entities_select_authenticated
  on public.entities for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists entities_insert_authenticated on public.entities;
create policy entities_insert_authenticated
  on public.entities for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists entities_update_authenticated on public.entities;
create policy entities_update_authenticated
  on public.entities for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists entities_delete_authenticated on public.entities;
create policy entities_delete_authenticated
  on public.entities for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

revoke all on public.spaces from anon;
revoke all on public.entities from anon;
grant select, insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.entities to authenticated;

-- ---------------------------------------------------------------------------
-- Verification (optional — uncomment after apply)
-- ---------------------------------------------------------------------------
/*
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('spaces', 'entities')
  and relnamespace = 'public'::regnamespace;

select w.id as workspace_id,
       count(s.*) filter (where s.is_default) as default_space_count
from public.workspaces w
left join public.spaces s on s.workspace_id = w.id
group by w.id;

select count(*) as items_missing_space from public.work_items where space_id is null;
*/
