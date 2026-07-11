create or replace function public.claim_admin_if_none()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.claim_admin_if_none() from public, anon;
grant execute on function public.claim_admin_if_none() to authenticated;