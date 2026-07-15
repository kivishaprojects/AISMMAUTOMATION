create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'POST_PUBLISHED' | 'POST_FAILED' | 'CONTENT_REMINDER' | ...
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, read, created_at desc);
alter table public.notifications enable row level security;

create policy "users read own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications
  for update using (user_id = auth.uid());
