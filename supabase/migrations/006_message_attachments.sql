-- Add attachment columns to messages
alter table public.messages
  add column attachment_url  text,
  add column attachment_name text,
  add column attachment_type text,
  add column attachment_size int8;

-- Create storage bucket for chat attachments
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict do nothing;

-- Allow authenticated users to upload
create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-attachments');

-- Allow public read
create policy "Chat attachments are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-attachments');

-- Allow owners to delete their uploads
create policy "Uploaders can delete their chat attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-attachments' and owner = auth.uid());
