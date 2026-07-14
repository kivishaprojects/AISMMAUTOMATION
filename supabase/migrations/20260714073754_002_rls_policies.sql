-- Enable RLS on every tenant-owned table
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.brand_kits enable row level security;
alter table public.assets enable row level security;
alter table public.social_accounts enable row level security;
alter table public.posts enable row level security;
alter table public.post_assets enable row level security;
alter table public.post_targets enable row level security;
alter table public.ai_generation_jobs enable row level security;
alter table public.inbox_messages enable row level security;

-- Helper: orgs the current user belongs to
create or replace function public.user_org_ids()
returns setof uuid
language sql security definer stable as $$
  select organization_id from public.memberships where user_id = auth.uid();
$$;

-- Helper: does the current user have at least `min_role` power in org?
create or replace function public.user_has_role(org_id uuid, roles org_role[])
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and role = any(roles)
  );
$$;

-- Organizations: members can read; only OWNER/ADMIN can update
create policy "members read their orgs" on public.organizations
  for select using (id in (select public.user_org_ids()));
create policy "owners/admins update org" on public.organizations
  for update using (public.user_has_role(id, array['OWNER','ADMIN']::org_role[]));
create policy "authenticated users can create orgs" on public.organizations
  for insert with check (auth.uid() is not null);

-- Memberships: members can see membership rows for their orgs
create policy "members read memberships in their orgs" on public.memberships
  for select using (organization_id in (select public.user_org_ids()));
create policy "owners/admins manage memberships" on public.memberships
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN']::org_role[]));

-- Generic pattern for org-scoped tables: read = any member, write = EDITOR+
create policy "members read brand_kits" on public.brand_kits
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ write brand_kits" on public.brand_kits
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create policy "members read assets" on public.assets
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ write assets" on public.assets
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create policy "members read social_accounts" on public.social_accounts
  for select using (organization_id in (select public.user_org_ids()));
create policy "managers+ write social_accounts" on public.social_accounts
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER']::org_role[]));

create policy "members read posts" on public.posts
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ write posts" on public.posts
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create policy "members read post_assets" on public.post_assets
  for select using (post_id in (select id from public.posts where organization_id in (select public.user_org_ids())));
create policy "editors+ write post_assets" on public.post_assets
  for all using (post_id in (select id from public.posts where public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[])));

create policy "members read post_targets" on public.post_targets
  for select using (post_id in (select id from public.posts where organization_id in (select public.user_org_ids())));
create policy "editors+ write post_targets" on public.post_targets
  for all using (post_id in (select id from public.posts where public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[])));

create policy "members read ai_jobs" on public.ai_generation_jobs
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ create ai_jobs" on public.ai_generation_jobs
  for insert with check (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));

create policy "members read inbox" on public.inbox_messages
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage inbox" on public.inbox_messages
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
