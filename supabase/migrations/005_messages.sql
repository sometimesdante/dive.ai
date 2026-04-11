create table public.messages (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects (id) on delete cascade not null,
  sender_id  uuid references public.profiles (id) on delete set null,
  content    text not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Project members can view messages"
  on public.messages for select
  using (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = messages.project_id
    )
  );

create policy "Project members can send messages"
  on public.messages for insert
  with check (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = messages.project_id
    )
    and sender_id = auth.uid()
  );

-- Enable realtime
alter publication supabase_realtime add table public.messages;
