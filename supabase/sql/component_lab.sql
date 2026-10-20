-- Component lab: approvals, sidebar pins, dashboard widgets (run in Supabase SQL Editor)
-- Keys rows by profile_id (local Athera profile UUID from /api/profile/bootstrap)

create table if not exists public.component_catalog (
  id text primary key,
  title text not null,
  category text not null default 'general',
  surfaces text[] not null default '{lab}',
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_component_approvals (
  profile_id text not null,
  component_id text not null references public.component_catalog (id) on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (profile_id, component_id)
);

create table if not exists public.profile_sidebar_pins (
  profile_id text not null,
  component_id text not null references public.component_catalog (id) on delete cascade,
  sort_order int not null default 0,
  primary key (profile_id, component_id)
);

create table if not exists public.profile_dashboard_widgets (
  profile_id text not null,
  component_id text not null references public.component_catalog (id) on delete cascade,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  primary key (profile_id, component_id)
);

create index if not exists idx_profile_approvals_profile
  on public.profile_component_approvals (profile_id);

alter table public.component_catalog enable row level security;
alter table public.profile_component_approvals enable row level security;
alter table public.profile_sidebar_pins enable row level security;
alter table public.profile_dashboard_widgets enable row level security;

-- Localhost / dev: anon read catalog; profile tables writable (API validates cookie server-side)
drop policy if exists "catalog anon read" on public.component_catalog;
create policy "catalog anon read"
  on public.component_catalog for select to anon using (true);

drop policy if exists "catalog anon write" on public.component_catalog;
create policy "catalog anon write"
  on public.component_catalog for all to anon using (true) with check (true);

drop policy if exists "approvals anon all" on public.profile_component_approvals;
create policy "approvals anon all"
  on public.profile_component_approvals for all to anon using (true) with check (true);

drop policy if exists "sidebar anon all" on public.profile_sidebar_pins;
create policy "sidebar anon all"
  on public.profile_sidebar_pins for all to anon using (true) with check (true);

drop policy if exists "dashboard anon all" on public.profile_dashboard_widgets;
create policy "dashboard anon all"
  on public.profile_dashboard_widgets for all to anon using (true) with check (true);
