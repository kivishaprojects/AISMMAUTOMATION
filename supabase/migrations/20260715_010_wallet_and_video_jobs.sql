-- Wallet: prepaid credits for platform-managed AI generation usage.
alter table public.organizations
  add column credits_balance integer not null default 0;

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null, -- 'PURCHASE' | 'USAGE' | 'REFUND' | 'ADJUSTMENT'
  credits integer not null, -- positive for purchase/refund, negative for usage
  description text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);
create index on public.wallet_transactions (organization_id, created_at desc);
alter table public.wallet_transactions enable row level security;

create policy "members read wallet_transactions" on public.wallet_transactions
  for select using (organization_id in (select public.user_org_ids()));

create or replace function public.deduct_wallet_credits(
  org_id uuid,
  amount integer,
  description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
begin
  if not exists (
    select 1 from public.memberships
    where organization_id = org_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this organization';
  end if;

  select credits_balance into current_balance
  from public.organizations where id = org_id for update;

  if current_balance is null or current_balance < amount then
    raise exception 'Insufficient credits';
  end if;

  update public.organizations
  set credits_balance = credits_balance - amount
  where id = org_id;

  insert into public.wallet_transactions (organization_id, type, credits, description)
  values (org_id, 'USAGE', -amount, description);

  return current_balance - amount;
end;
$$;

revoke all on function public.deduct_wallet_credits(uuid, integer, text) from public;
grant execute on function public.deduct_wallet_credits(uuid, integer, text) to authenticated;

alter table public.ai_generation_jobs
  add column external_job_id text;
