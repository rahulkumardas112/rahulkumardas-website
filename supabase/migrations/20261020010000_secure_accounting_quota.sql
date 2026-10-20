drop function if exists public.consume_accounting_quota(uuid, integer);

create or replace function public.consume_accounting_quota(
  p_limit integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  affected integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid quota limit';
  end if;

  insert into public.accounting_usage (user_id, usage_date, request_count, updated_at)
  values (v_user_id, current_date, 1, now())
  on conflict (user_id, usage_date)
  do update set
    request_count = public.accounting_usage.request_count + 1,
    updated_at = now()
  where public.accounting_usage.request_count < p_limit;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.consume_accounting_quota(integer) from public, anon;
grant execute on function public.consume_accounting_quota(integer) to authenticated;
