create table public.site_changes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  batch_id uuid not null default gen_random_uuid(),
  page_url text,
  change_type text not null,
  label text not null,
  current_value text,
  proposed_value text not null,
  file_path text,
  status text not null default 'DRAFT',
  pr_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.site_changes (organization_id, batch_id);
create index on public.site_changes (organization_id, status);
alter table public.site_changes enable row level security;

create policy "members read site_changes" on public.site_changes
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage site_changes" on public.site_changes
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create trigger site_changes_set_updated_at before update on public.site_changes
  for each row execute function public.set_updated_at();
