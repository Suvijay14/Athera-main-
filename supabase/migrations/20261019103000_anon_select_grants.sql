-- Anon clients need table SELECT privilege so RLS can filter to zero rows (not 42501).
-- Insert/update remain denied; policies are authenticated-only.

grant select on public.workspaces to anon;
grant select on public.field_definitions to anon;
grant select on public.work_items to anon;
grant select on public.view_definitions to anon;
grant select on public.recurrence_rules to anon;
grant select on public.suggestions to anon;
grant select on public.change_log to anon;
grant select on public.events to anon;
grant select on public.spaces to anon;
grant select on public.entities to anon;
grant select on public.item_entity_extractions to anon;
grant select on public.drafts to anon;
