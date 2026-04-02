create policy "Anyone can upload payment proofs"
on storage.objects
for insert
to public
with check (bucket_id = 'payment-proofs');
