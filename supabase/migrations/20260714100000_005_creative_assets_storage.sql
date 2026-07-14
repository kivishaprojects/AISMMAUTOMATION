-- Public bucket for AI-generated creatives (images, later video/audio).
insert into storage.buckets (id, name, public)
values ('creative-assets', 'creative-assets', true)
on conflict (id) do nothing;

create policy "public read creative-assets"
  on storage.objects for select
  using (bucket_id = 'creative-assets');

create policy "editors+ upload creative-assets"
  on storage.objects for insert
  with check (
    bucket_id = 'creative-assets'
    and public.user_has_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]
    )
  );

create policy "editors+ delete creative-assets"
  on storage.objects for delete
  using (
    bucket_id = 'creative-assets'
    and public.user_has_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','MANAGER','EDITOR']::org_role[]
    )
  );
