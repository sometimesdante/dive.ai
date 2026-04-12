-- =============================================================
-- 11. NOTES
-- Per-project markdown notes; each user owns their own notes
-- =============================================================
create table public.notes (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects (id) on delete cascade not null,
  owner_id   uuid references public.profiles (id) on delete cascade not null,
  title      text not null default 'Untitled',
  content    text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notes enable row level security;

create policy "Note owners can view their notes"
  on public.notes for select
  using (owner_id = auth.uid());

create policy "Note owners can create notes"
  on public.notes for insert
  with check (owner_id = auth.uid());

create policy "Note owners can update their notes"
  on public.notes for update
  using (owner_id = auth.uid());

create policy "Note owners can delete their notes"
  on public.notes for delete
  using (owner_id = auth.uid());


-- =============================================================
-- 12. NOTE VERSIONS
-- Snapshot-based version history for notes
-- =============================================================
create table public.note_versions (
  id         uuid default gen_random_uuid() primary key,
  note_id    uuid references public.notes (id) on delete cascade not null,
  content    text not null,
  title      text not null,
  created_at timestamptz default now() not null
);

alter table public.note_versions enable row level security;

create policy "Note owners can view their note versions"
  on public.note_versions for select
  using (
    exists (
      select 1 from public.notes
      where id = note_versions.note_id and owner_id = auth.uid()
    )
  );

create policy "Note owners can create note versions"
  on public.note_versions for insert
  with check (
    exists (
      select 1 from public.notes
      where id = note_versions.note_id and owner_id = auth.uid()
    )
  );
