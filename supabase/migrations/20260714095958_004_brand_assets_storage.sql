-- Public bucket for brand logos and creative assets. Files are organized
-- under `{organization_id}/...` so storage RLS can key off the same
-- membership/role checks as the rest of the schema.
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "public read brand-assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "editors+ upload brand-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-assets'
    and public.user_has_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]
    )
  );

create policy "editors+ update brand-assets"
  on storage.objects for update
  using (
    bucket_id = 'brand-assets'
    and public.user_has_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]
    )
  );

create policy "editors+ delete brand-assets"
  on storage.objects for delete
  using (
    bucket_id = 'brand-assets'
    and public.user_has_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]
    )
  );
