-- Technical SEO audits
create table public.seo_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  url text not null,
  score integer,
  checks jsonb,
  pagespeed jsonb,
  recommendations text,
  created_at timestamptz not null default now()
);
create index on public.seo_audits (organization_id, created_at desc);
alter table public.seo_audits enable row level security;

create policy "members read seo_audits" on public.seo_audits
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ create seo_audits" on public.seo_audits
  for insert with check (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

-- GEO / AI visibility tracking
create table public.geo_tracked_prompts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  prompt text not null,
  brand_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.geo_tracked_prompts enable row level security;

create policy "members read geo_tracked_prompts" on public.geo_tracked_prompts
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage geo_tracked_prompts" on public.geo_tracked_prompts
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create table public.geo_check_results (
  id uuid primary key default gen_random_uuid(),
  tracked_prompt_id uuid not null references public.geo_tracked_prompts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null default 'openai',
  mentioned boolean not null,
  response_snippet text,
  checked_at timestamptz not null default now()
);
create index on public.geo_check_results (tracked_prompt_id, checked_at desc);
alter table public.geo_check_results enable row level security;

create policy "members read geo_check_results" on public.geo_check_results
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ create geo_check_results" on public.geo_check_results
  for insert with check (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
