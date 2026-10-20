-- Task 14: Feature 3a recurrence (recurrence_rules was empty at apply time — no backfill).

alter table public.recurrence_rules
  drop column if exists interval_days,
  drop column if exists next_run,
  drop column if exists template;

alter table public.recurrence_rules
  add column if not exists space_id uuid references public.spaces (id) on delete cascade,
  add column if not exists template_item jsonb not null default '{}'::jsonb,
  add column if not exists freq text not null default 'weekly',
  add column if not exists interval_count integer not null default 1,
  add column if not exists by_weekday integer[] not null default '{}',
  add column if not exists time_of_day time,
  add column if not exists duration_min integer,
  add column if not exists starts_on date not null default current_date,
  add column if not exists ends_on date,
  add column if not exists exceptions date[] not null default '{}';

alter table public.recurrence_rules
  drop constraint if exists recurrence_rules_freq_check;

alter table public.recurrence_rules
  add constraint recurrence_rules_freq_check check (freq in ('weekly'));

alter table public.recurrence_rules
  drop constraint if exists recurrence_rules_interval_count_check;

alter table public.recurrence_rules
  add constraint recurrence_rules_interval_count_check check (interval_count in (1, 2));

alter table public.work_items
  add column if not exists recurrence_id uuid references public.recurrence_rules (id) on delete set null,
  add column if not exists recurrence_instance_date date;

create index if not exists work_items_recurrence_instance_idx
  on public.work_items (workspace_id, recurrence_id, recurrence_instance_date)
  where recurrence_id is not null;

create index if not exists recurrence_rules_workspace_space_idx
  on public.recurrence_rules (workspace_id, space_id)
  where active = true;
