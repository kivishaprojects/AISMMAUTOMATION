-- AI Scan: whole-site AI screening with scored breakdown and executable suggestions
create table public.ai_scans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  site_url text not null,
  business_context text,
  pages_crawled int not null default 0,
  scores jsonb not null default '{}'::jsonb,
  summary text,
  suggestions jsonb not null default '[]'::jsonb,
  status text not null default 'COMPLETED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ai_scans (organization_id, created_at desc);
alter table public.ai_scans enable row level security;

create policy "members read ai_scans" on public.ai_scans
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage ai_scans" on public.ai_scans
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create trigger ai_scans_set_updated_at before update on public.ai_scans
  for each row execute function public.set_updated_at();
