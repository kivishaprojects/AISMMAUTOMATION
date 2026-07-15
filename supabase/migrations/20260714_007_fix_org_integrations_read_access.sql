-- Any org member needs to read the API key preference so generation works
-- for EDITORs too, not just OWNER/ADMIN. Writing (changing the key/mode)
-- stays restricted to OWNER/ADMIN.
drop policy "owners/admins read integrations" on public.org_integrations;

create policy "members read integrations" on public.org_integrations
  for select using (organization_id in (select public.user_org_ids()));
