-- Task 18: subscription billing fields + account deletion marker on workspaces (account container).

alter table public.workspaces
  add column if not exists stripe_customer_id text;

alter table public.workspaces
  add column if not exists stripe_subscription_id text;

alter table public.workspaces
  add column if not exists plan text not null default 'free';

alter table public.workspaces
  add column if not exists subscription_status text not null default 'active';

alter table public.workspaces
  add column if not exists current_period_end timestamptz;

alter table public.workspaces
  add column if not exists trial_ends_at timestamptz;

alter table public.workspaces
  add column if not exists deleted_at timestamptz;

alter table public.workspaces drop constraint if exists workspaces_plan_check;
alter table public.workspaces
  add constraint workspaces_plan_check check (plan in ('free', 'personal', 'business'));

alter table public.workspaces drop constraint if exists workspaces_subscription_status_check;
alter table public.workspaces
  add constraint workspaces_subscription_status_check
  check (subscription_status in ('active', 'past_due', 'canceled', 'trialing'));

-- Billing fields are readable by owner via existing workspaces RLS; updates only via service role (webhook).
