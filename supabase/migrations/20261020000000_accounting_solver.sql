create table if not exists public.accounting_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  subject text not null default 'General Accounting',
  created_at timestamptz not null default now()
);

create index if not exists accounting_history_user_date_idx
  on public.accounting_history (user_id, created_at desc);

alter table public.accounting_history enable row level security;

revoke all on public.accounting_history from anon;
grant select, insert, delete on public.accounting_history to authenticated;

drop policy if exists "Users read own accounting history" on public.accounting_history;
create policy "Users read own accounting history"
  on public.accounting_history for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users save own accounting history" on public.accounting_history;
create policy "Users save own accounting history"
  on public.accounting_history for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own accounting history" on public.accounting_history;
create policy "Users delete own accounting history"
  on public.accounting_history for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.accounting_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.accounting_usage enable row level security;
revoke all on public.accounting_usage from anon, authenticated;

create or replace function public.consume_accounting_quota(
  p_user_id uuid,
  p_limit integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid quota limit';
  end if;

  insert into public.accounting_usage (user_id, usage_date, request_count, updated_at)
  values (p_user_id, current_date, 1, now())
  on conflict (user_id, usage_date)
  do update set
    request_count = public.accounting_usage.request_count + 1,
    updated_at = now()
  where public.accounting_usage.request_count < p_limit;

  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.consume_accounting_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_accounting_quota(uuid, integer) to service_role;
