-- Per-org API key preference: use platform-managed keys, or bring your own.
create table public.org_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null, -- 'openai', 'stability', etc.
  mode text not null default 'MANAGED', -- 'MANAGED' | 'CUSTOM'
  api_key text, -- only set when mode = 'CUSTOM'. TODO: encrypt via pgsodium before production use.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);
alter table public.org_integrations enable row level security;

create policy "owners/admins read integrations" on public.org_integrations
  for select using (public.user_has_role(organization_id, array['OWNER','ADMIN']::org_role[]));
create policy "owners/admins write integrations" on public.org_integrations
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN']::org_role[]));

create trigger org_integrations_set_updated_at before update on public.org_integrations
  for each row execute function public.set_updated_at();

-- Content planning notes: mark a date for content generation.
create table public.content_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  note_date date not null,
  title text not null,
  details text,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.content_notes (organization_id, note_date);
alter table public.content_notes enable row level security;

create policy "members read content_notes" on public.content_notes
  for select using (organization_id in (select public.user_org_ids()));
create policy "editors+ manage content_notes" on public.content_notes
  for all using (public.user_has_role(organization_id, array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]));
