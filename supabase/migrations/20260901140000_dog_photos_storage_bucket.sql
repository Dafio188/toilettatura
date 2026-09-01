-- Bucket storage pubblico per le foto dei cani dei clienti.
-- - Ogni utente autenticato può scrivere SOLO nella propria cartella (/{owner_id}/...)
-- - Le foto sono pubblicamente leggibili (per la visualizzazione nelle card senza firma URL)
-- - I file sono limitati a immagini < 5 MB

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dog-photos',
  'dog-photos',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Policy: tutti (anon + auth) possono leggere le foto (URL pubblico)
drop policy if exists "Dog photos are publicly readable" on storage.objects;
create policy "Dog photos are publicly readable"
on storage.objects for select
using (bucket_id = 'dog-photos');

-- Policy: un utente autenticato può caricare solo nella propria cartella (owner_id)
drop policy if exists "Users can upload their own dog photos" on storage.objects;
create policy "Users can upload their own dog photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: un utente può aggiornare/sovrascrivere solo file nella propria cartella
drop policy if exists "Users can update their own dog photos" on storage.objects;
create policy "Users can update their own dog photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: un utente può cancellare solo le proprie foto
drop policy if exists "Users can delete their own dog photos" on storage.objects;
create policy "Users can delete their own dog photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy: admin del salone possono cancellare foto dei cani dei propri clienti
drop policy if exists "Tenant admins can delete dog photos" on storage.objects;
create policy "Tenant admins can delete dog photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'dog-photos'
  and public.is_admin()
);
