-- Athera core workspace schema: tables, RLS, helper functions.
-- Safe to run the entire file in the Supabase SQL Editor (idempotent).
-- `supabase db push` on an empty database is also supported.

-- ---------------------------------------------------------------------------
-- Trigger helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My workspace',
  business_type text,
  item_label text not null default 'Task',
  onboarding_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_owner_id_unique unique (owner_id)
);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row
  execute function public.set_updated_at();

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws
      and w.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

create table if not exists public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  key text not null,
  label text not null,
  type text not null,
  options jsonb not null default '[]'::jsonb,
  visible boolean not null default true,
  position integer not null default 0,
  source text not null,
  created_at timestamptz not null default now(),
  constraint field_definitions_type_check
    check (type in ('text', 'number', 'date', 'select', 'checkbox')),
  constraint field_definitions_key_format_check
    check (key ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint field_definitions_key_reserved_check
    check (key not in ('title', 'due_date', 'notes', 'id', 'created_at', 'updated_at')),
  constraint field_definitions_source_check
    check (source in ('onboarding', 'user', 'athera')),
  constraint field_definitions_options_array_check
    check (jsonb_typeof(options) = 'array'),
  constraint field_definitions_workspace_key_unique unique (workspace_id, key)
);

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  due_date date,
  notes text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_items_title_nonempty_check check (length(btrim(title)) > 0),
  constraint work_items_data_object_check check (jsonb_typeof(data) = 'object')
);

create index if not exists work_items_workspace_created_at_idx
  on public.work_items (workspace_id, created_at desc);

create index if not exists work_items_workspace_due_date_idx
  on public.work_items (workspace_id, due_date);

create index if not exists work_items_data_gin_idx
  on public.work_items using gin (data jsonb_path_ops);

drop trigger if exists work_items_set_updated_at on public.work_items;
create trigger work_items_set_updated_at
  before update on public.work_items
  for each row
  execute function public.set_updated_at();

create table if not exists public.view_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  type text not null,
  group_by_field text,
  filters jsonb not null default '{}'::jsonb,
  visible boolean not null default true,
  position integer not null default 0,
  source text not null,
  created_at timestamptz not null default now(),
  constraint view_definitions_type_check
    check (type in ('list', 'grouped', 'board')),
  constraint view_definitions_source_check
    check (source in ('onboarding', 'user', 'athera')),
  constraint view_definitions_group_by_required_check
    check ((type = 'list') or (group_by_field is not null)),
  constraint view_definitions_workspace_name_unique unique (workspace_id, name),
  constraint view_definitions_group_by_field_fkey
    foreign key (workspace_id, group_by_field)
    references public.field_definitions (workspace_id, key)
    on delete restrict
);

create table if not exists public.recurrence_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  template jsonb not null,
  interval_days integer not null,
  next_run date not null,
  active boolean not null default true,
  source text not null,
  created_at timestamptz not null default now(),
  constraint recurrence_rules_interval_days_check
    check (interval_days between 1 and 366),
  constraint recurrence_rules_source_check
    check (source in ('onboarding', 'user', 'athera'))
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(4, 3) not null,
  operations jsonb not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint suggestions_status_check
    check (status in ('pending', 'shown', 'accepted', 'dismissed', 'undone', 'expired')),
  constraint suggestions_confidence_check
    check (confidence between 0 and 1),
  constraint suggestions_operations_array_check
    check (jsonb_typeof(operations) = 'array'),
  constraint suggestions_id_workspace_unique unique (id, workspace_id)
);

create unique index if not exists suggestions_active_dedupe_idx
  on public.suggestions (workspace_id, dedupe_key)
  where status in ('pending', 'shown', 'accepted');

create index if not exists suggestions_workspace_status_created_idx
  on public.suggestions (workspace_id, status, created_at desc);

create index if not exists suggestions_workspace_dedupe_resolved_idx
  on public.suggestions (workspace_id, dedupe_key, resolved_at);

create table if not exists public.change_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  suggestion_id uuid not null,
  operations jsonb not null,
  inverse_operations jsonb not null,
  applied_at timestamptz not null default now(),
  undone_at timestamptz,
  constraint change_log_operations_array_check
    check (jsonb_typeof(operations) = 'array'),
  constraint change_log_inverse_operations_array_check
    check (jsonb_typeof(inverse_operations) = 'array'),
  constraint change_log_suggestion_workspace_fkey
    foreign key (suggestion_id, workspace_id)
    references public.suggestions (id, workspace_id)
    on delete cascade
);

create index if not exists change_log_workspace_applied_idx
  on public.change_log (workspace_id, applied_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint events_name_check
    check (name in (
      'onboarding_completed',
      'item_created',
      'item_edited',
      'suggestion_shown',
      'suggestion_previewed',
      'suggestion_accepted',
      'suggestion_dismissed',
      'suggestion_undone',
      'view_opened',
      'adaptation_retained',
      'adaptation_abandoned'
    ))
);

create index if not exists events_workspace_name_created_idx
  on public.events (workspace_id, name, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

alter table public.field_definitions enable row level security;
alter table public.field_definitions force row level security;

alter table public.work_items enable row level security;
alter table public.work_items force row level security;

alter table public.view_definitions enable row level security;
alter table public.view_definitions force row level security;

alter table public.recurrence_rules enable row level security;
alter table public.recurrence_rules force row level security;

alter table public.suggestions enable row level security;
alter table public.suggestions force row level security;

alter table public.change_log enable row level security;
alter table public.change_log force row level security;

alter table public.events enable row level security;
alter table public.events force row level security;

-- workspaces
drop policy if exists workspaces_select_authenticated on public.workspaces;
create policy workspaces_select_authenticated
  on public.workspaces for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists workspaces_insert_authenticated on public.workspaces;
create policy workspaces_insert_authenticated
  on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists workspaces_update_authenticated on public.workspaces;
create policy workspaces_update_authenticated
  on public.workspaces for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- field_definitions
drop policy if exists field_definitions_select_authenticated on public.field_definitions;
create policy field_definitions_select_authenticated
  on public.field_definitions for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists field_definitions_insert_authenticated on public.field_definitions;
create policy field_definitions_insert_authenticated
  on public.field_definitions for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists field_definitions_update_authenticated on public.field_definitions;
create policy field_definitions_update_authenticated
  on public.field_definitions for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists field_definitions_delete_authenticated on public.field_definitions;
create policy field_definitions_delete_authenticated
  on public.field_definitions for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- work_items
drop policy if exists work_items_select_authenticated on public.work_items;
create policy work_items_select_authenticated
  on public.work_items for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists work_items_insert_authenticated on public.work_items;
create policy work_items_insert_authenticated
  on public.work_items for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists work_items_update_authenticated on public.work_items;
create policy work_items_update_authenticated
  on public.work_items for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists work_items_delete_authenticated on public.work_items;
create policy work_items_delete_authenticated
  on public.work_items for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- view_definitions
drop policy if exists view_definitions_select_authenticated on public.view_definitions;
create policy view_definitions_select_authenticated
  on public.view_definitions for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists view_definitions_insert_authenticated on public.view_definitions;
create policy view_definitions_insert_authenticated
  on public.view_definitions for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists view_definitions_update_authenticated on public.view_definitions;
create policy view_definitions_update_authenticated
  on public.view_definitions for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists view_definitions_delete_authenticated on public.view_definitions;
create policy view_definitions_delete_authenticated
  on public.view_definitions for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- recurrence_rules
drop policy if exists recurrence_rules_select_authenticated on public.recurrence_rules;
create policy recurrence_rules_select_authenticated
  on public.recurrence_rules for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists recurrence_rules_insert_authenticated on public.recurrence_rules;
create policy recurrence_rules_insert_authenticated
  on public.recurrence_rules for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists recurrence_rules_update_authenticated on public.recurrence_rules;
create policy recurrence_rules_update_authenticated
  on public.recurrence_rules for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists recurrence_rules_delete_authenticated on public.recurrence_rules;
create policy recurrence_rules_delete_authenticated
  on public.recurrence_rules for delete to authenticated
  using (public.is_workspace_owner(workspace_id));

-- suggestions
drop policy if exists suggestions_select_authenticated on public.suggestions;
create policy suggestions_select_authenticated
  on public.suggestions for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists suggestions_insert_authenticated on public.suggestions;
create policy suggestions_insert_authenticated
  on public.suggestions for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists suggestions_update_authenticated on public.suggestions;
create policy suggestions_update_authenticated
  on public.suggestions for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- change_log
drop policy if exists change_log_select_authenticated on public.change_log;
create policy change_log_select_authenticated
  on public.change_log for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists change_log_insert_authenticated on public.change_log;
create policy change_log_insert_authenticated
  on public.change_log for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists change_log_update_authenticated on public.change_log;
create policy change_log_update_authenticated
  on public.change_log for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- events
drop policy if exists events_select_authenticated on public.events;
create policy events_select_authenticated
  on public.events for select to authenticated
  using (public.is_workspace_owner(workspace_id));

drop policy if exists events_insert_authenticated on public.events;
create policy events_insert_authenticated
  on public.events for insert to authenticated
  with check (
    public.is_workspace_owner(workspace_id)
    and user_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on public.workspaces from anon;
revoke all on public.field_definitions from anon;
revoke all on public.work_items from anon;
revoke all on public.view_definitions from anon;
revoke all on public.recurrence_rules from anon;
revoke all on public.suggestions from anon;
revoke all on public.change_log from anon;
revoke all on public.events from anon;

grant select, insert, update on public.workspaces to authenticated;
grant select, insert, update, delete on public.field_definitions to authenticated;
grant select, insert, update, delete on public.work_items to authenticated;
grant select, insert, update, delete on public.view_definitions to authenticated;
grant select, insert, update, delete on public.recurrence_rules to authenticated;
grant select, insert, update on public.suggestions to authenticated;
grant select, insert, update on public.change_log to authenticated;
grant select, insert on public.events to authenticated;

-- ---------------------------------------------------------------------------
-- Verification (optional — uncomment to run after apply)
-- ---------------------------------------------------------------------------
/*
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in (
  'workspaces',
  'field_definitions',
  'work_items',
  'view_definitions',
  'recurrence_rules',
  'suggestions',
  'change_log',
  'events'
)
and relnamespace = 'public'::regnamespace;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'workspaces',
    'field_definitions',
    'work_items',
    'view_definitions',
    'recurrence_rules',
    'suggestions',
    'change_log',
    'events'
  )
order by tablename, policyname;
*/
