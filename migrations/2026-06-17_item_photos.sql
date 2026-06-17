-- Bagged — photos on list items.

alter table items add column if not exists image_url text;

-- Public storage bucket for item photos (shared-list items are viewable by members
-- and via share links, so public-read URLs are acceptable here).
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

drop policy if exists "item photos public read" on storage.objects;
create policy "item photos public read" on storage.objects for select
  using (bucket_id = 'item-photos');

drop policy if exists "item photos auth upload" on storage.objects;
create policy "item photos auth upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos');

drop policy if exists "item photos owner delete" on storage.objects;
create policy "item photos owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and owner = auth.uid());
