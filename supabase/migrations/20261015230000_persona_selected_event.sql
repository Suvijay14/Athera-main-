-- Task 19: persona_selected onboarding event.

alter table public.events drop constraint if exists events_name_check;

alter table public.events add constraint events_name_check
  check (
    name in (
      'onboarding_completed',
      'persona_selected',
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
      'command_request',
      'item_moved_space',
      'notes_updated'
    )
  );
