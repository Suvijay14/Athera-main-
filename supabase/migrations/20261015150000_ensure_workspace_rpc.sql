-- Reliable workspace bootstrap for new users (insert + default space) under auth.uid().

create or replace function public.ensure_workspace_for_user()
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.workspaces;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.workspaces (owner_id)
  values (uid)
  on conflict (owner_id) do nothing;

  select * into result from public.workspaces where owner_id = uid limit 1;

  if result.id is null then
    raise exception 'workspace_bootstrap_failed';
  end if;

  insert into public.spaces (workspace_id, name, is_default, sort_order)
  select result.id, 'My space', true, 0
  where not exists (
    select 1
    from public.spaces s
    where s.workspace_id = result.id
      and s.is_default = true
  );

  return result;
end;
$$;

revoke all on function public.ensure_workspace_for_user() from public;
grant execute on function public.ensure_workspace_for_user() to authenticated;
