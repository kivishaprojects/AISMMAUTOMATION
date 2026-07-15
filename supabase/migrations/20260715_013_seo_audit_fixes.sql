create table public.seo_audit_fixes (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.seo_audits(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  fix_type text not null, -- 'TITLE' | 'META_DESCRIPTION' | 'H1' | 'ALT_TEXT'
  target_ref text, -- e.g. image src, for ALT_TEXT fixes
  current_value text,
  suggested_value text not null,
  snippet text not null, -- ready-to-paste HTML/code snippet
  status text not null default 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at timestamptz not null default now()
);
create index on public.seo_audit_fixes (audit_id);
alter table public.seo_audit_fixes enable row level security;

create policy "members read seo_audit_fixes" on public.seo_audit_fixes
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage seo_audit_fixes" on public.seo_audit_fixes
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
