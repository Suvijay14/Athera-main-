-- Extend events.name check for command bar instrumentation (Task 12).

alter table public.events drop constraint if exists events_name_check;

alter table public.events add constraint events_name_check
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
    'adaptation_abandoned',
    'command_unsupported',
    'command_request'
  ));
