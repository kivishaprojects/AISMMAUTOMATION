-- Structured, approvable fixes generated alongside an audit.
alter table public.seo_audits
  add column suggested_title text,
  add column suggested_meta_description text,
  add column alt_text_suggestions jsonb,
  add column fixes_status jsonb;

-- Optional GitHub repo connection, used to auto-open PRs for approved fixes.
create table public.repo_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null default 'github',
  repo_owner text not null,
  repo_name text not null,
  access_token_encrypted text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, provider, repo_owner, repo_name)
);
alter table public.repo_connections enable row level security;

create policy "owners/admins read repo_connections" on public.repo_connections
  for select using (public.user_has_role(organization_id, array['OWNER','ADMIN']::org_role[]));
create policy "owners/admins write repo_connections" on public.repo_connections
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN']::org_role[]));
