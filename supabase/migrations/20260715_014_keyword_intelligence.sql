create table public.keyword_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  topic text,
  keywords_input text not null,
  clusters jsonb,
  gaps text,
  created_at timestamptz not null default now()
);
create index on public.keyword_reports (organization_id, created_at desc);
alter table public.keyword_reports enable row level security;

create policy "members read keyword_reports" on public.keyword_reports
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ create keyword_reports" on public.keyword_reports
  for insert with check (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
