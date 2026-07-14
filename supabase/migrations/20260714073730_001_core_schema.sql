-- Extensions
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────
create type public.org_role as enum ('OWNER','ADMIN','MANAGER','EDITOR','APPROVER','VIEWER');
create type public.plan_type as enum ('FREE','STARTER','GROWTH','ENTERPRISE','AGENCY');
create type public.asset_type as enum ('IMAGE','VIDEO','AUDIO','DOCUMENT');
create type public.platform_type as enum ('FACEBOOK','INSTAGRAM','LINKEDIN','X','THREADS','PINTEREST','YOUTUBE','GOOGLE_BUSINESS','WHATSAPP');
create type public.connection_status as enum ('ACTIVE','EXPIRED','REVOKED','ERROR');
create type public.post_status as enum ('DRAFT','SCHEDULED','PUBLISHING','PUBLISHED','FAILED');
create type public.approval_state as enum ('NOT_REQUIRED','PENDING','APPROVED','REJECTED');

-- ── Organizations ────────────────────────────────
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan plan_type not null default 'FREE',
  parent_org_id uuid references public.organizations(id),
  is_white_label boolean not null default false,
  brand_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.organizations (parent_org_id);

-- ── Memberships (links auth.users to organizations) ──
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role org_role not null default 'EDITOR',
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);
create index on public.memberships (organization_id);

-- ── Brand Kits ───────────────────────────────────
create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  logo_url text,
  colors jsonb,
  fonts jsonb,
  tone_of_voice text,
  created_at timestamptz not null default now()
);
create index on public.brand_kits (organization_id);

-- ── Assets ───────────────────────────────────────
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_kit_id uuid references public.brand_kits(id),
  type asset_type not null,
  storage_path text not null,
  url text not null,
  metadata jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.assets (organization_id);

-- ── Social Accounts ──────────────────────────────
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform platform_type not null,
  external_id text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  status connection_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (organization_id, platform, external_id)
);
create index on public.social_accounts (organization_id);

-- ── Posts ────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  status post_status not null default 'DRAFT',
  caption text,
  hashtags text[] default '{}',
  scheduled_for timestamptz,
  approval_state approval_state not null default 'NOT_REQUIRED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.posts (organization_id, status);
create index on public.posts (scheduled_for);

create table public.post_assets (
  post_id uuid not null references public.posts(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  primary key (post_id, asset_id)
);

create table public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  platform_post_id text,
  status post_status not null default 'SCHEDULED',
  error_message text,
  created_at timestamptz not null default now()
);
create index on public.post_targets (post_id);

-- ── AI Generation Jobs ───────────────────────────
create table public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  type text not null,
  provider text not null,
  prompt text not null,
  status text not null default 'QUEUED',
  result_asset_id uuid references public.assets(id),
  cost_cents integer,
  created_at timestamptz not null default now()
);
create index on public.ai_generation_jobs (organization_id, type);

-- ── Inbox Messages ───────────────────────────────
create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform platform_type not null,
  channel text not null,
  external_id text not null,
  from_name text,
  body text not null,
  ai_suggested_reply text,
  status text not null default 'UNREAD',
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.inbox_messages (organization_id, status);

-- ── updated_at trigger helper ────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
