create table public.page_analysis_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  page_name text,
  score integer,
  checklist jsonb,
  stats jsonb,
  recommendations text,
  created_at timestamptz not null default now()
);
create index on public.page_analysis_reports (organization_id, created_at desc);
alter table public.page_analysis_reports enable row level security;

create policy "members read page_analysis_reports" on public.page_analysis_reports
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ create page_analysis_reports" on public.page_analysis_reports
  for insert with check (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
