-- Shared storage for generated SEO documents: content briefs/articles, GEO
-- optimization reports, internal-linking plans, competitor analyses.
create table public.content_docs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  doc_type text not null,
  title text not null,
  input_context text,
  content text not null,
  created_at timestamptz not null default now()
);
create index on public.content_docs (organization_id, doc_type, created_at desc);
alter table public.content_docs enable row level security;
create policy "members read content_docs" on public.content_docs
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage content_docs" on public.content_docs
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
