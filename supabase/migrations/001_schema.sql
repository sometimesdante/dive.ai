-- =============================================================
-- 0. FULL RESET — drop all data, tables, functions, triggers
-- =============================================================

-- Drop all existing RLS policies
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename, schemaname
    from pg_policies
    where schemaname in ('public', 'storage')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  end loop;
end;
$$;

-- Drop all tables in public schema (cascades data and foreign keys)
do $$
declare
  r record;
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end;
$$;

-- Drop all functions in public schema
do $$
declare
  r record;
begin
  for r in
    select routine_name, specific_name
    from information_schema.routines
    where routine_schema = 'public' and routine_type = 'FUNCTION'
  loop
    execute format('drop function if exists public.%I cascade', r.routine_name);
  end loop;
end;
$$;

-- Note: storage objects/buckets cannot be deleted via SQL.
-- The bucket insert below uses ON CONFLICT DO NOTHING so reruns are safe.


-- =============================================================
-- 1. ORGANIZATIONS
-- =============================================================
create table public.organizations (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table public.organizations enable row level security;

-- Org RLS policies are defined below, after profiles exists.


-- =============================================================
-- 2. PROFILES
-- 1-to-1 with auth.users; auto-created via trigger
-- =============================================================
create table public.profiles (
  id         uuid references auth.users (id) on delete cascade primary key,
  org_id     uuid references public.organizations (id) on delete set null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  email      text,
  name       text,
  phone      text,
  address    text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Helper: returns the org_id of the current user without triggering RLS.
-- Must be defined after profiles exists (SQL functions are validated at creation).
create or replace function public.get_auth_org_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Org members can view profiles in same org"
  on public.profiles for select
  using (
    org_id is not null
    and org_id = public.get_auth_org_id()
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- Trigger: auto-insert profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, phone, address)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================
-- 4. ORGANIZATIONS RLS
-- Defined after profiles because policies reference it
-- =============================================================
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);

create policy "Members can view own organization"
  on public.organizations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = organizations.id
    )
  );

create policy "Admins can update own organization"
  on public.organizations for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = organizations.id and role = 'admin'
    )
  );


-- =============================================================
-- 4. ORG INVITES
-- =============================================================
create table public.org_invites (
  id          uuid default gen_random_uuid() primary key,
  org_id      uuid references public.organizations (id) on delete cascade not null,
  email       text not null,
  token       uuid default gen_random_uuid() not null unique,
  invited_by  uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz default now() not null
);

alter table public.org_invites enable row level security;

create policy "Admins can view org invites"
  on public.org_invites for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );

create policy "Admins can create invites"
  on public.org_invites for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );

create policy "Admins can delete invites"
  on public.org_invites for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 5. CLUSTERS
-- Clients that an organization is serving
-- =============================================================
create table public.clusters (
  id         uuid default gen_random_uuid() primary key,
  org_id     uuid references public.organizations (id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table public.clusters enable row level security;

create policy "Members can view org clusters"
  on public.clusters for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

create policy "Members can create clusters"
  on public.clusters for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

create policy "Members can update clusters"
  on public.clusters for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

create policy "Admins can delete clusters"
  on public.clusters for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = clusters.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 6. PROJECTS
-- Belong to an org and optionally a cluster
-- =============================================================
create table public.projects (
  id                    uuid default gen_random_uuid() primary key,
  org_id                uuid references public.organizations (id) on delete cascade not null,
  cluster_id            uuid references public.clusters (id) on delete set null,
  owner_id              uuid references public.profiles (id) on delete set null,
  code                  text not null,
  name                  text not null,
  description           text,
  status                text not null default 'default'
                          check (status in ('default', 'overdue', 'approaching', 'on-track')),
  stage                 text not null default 'backlog'
                          check (stage in ('backlog', 'todo', 'doing', 'done')),
  position              float8 not null default 0,
  planned_start         date,
  planned_end           date,
  sprint_cadence        text default 'bi-weekly'
                          check (sprint_cadence in ('weekly', 'bi-weekly', 'monthly')),
  timezone              text default 'UTC',
  is_public             boolean not null default false,
  pages_enabled         boolean not null default false,
  tickets_enabled       boolean not null default false,
  time_tracking_enabled boolean not null default false,
  cost_center_code      text,
  is_archived           boolean not null default false,
  created_at            timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Members can view org projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

create policy "Members can create projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

create policy "Members can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

create policy "Admins can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and org_id = projects.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 7. PROJECT MEMBERS
-- Users associated at the project level
-- =============================================================
create table public.project_members (
  project_id uuid references public.projects (id) on delete cascade not null,
  profile_id uuid references public.profiles (id) on delete cascade not null,
  role       text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  primary key (project_id, profile_id)
);

alter table public.project_members enable row level security;

create policy "Org members can view project membership"
  on public.project_members for select
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id and p.id = auth.uid()
    )
  );

create policy "Project owner or org admin can manage members"
  on public.project_members for all
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id
        and p.id = auth.uid()
        and (pr.owner_id = p.id or p.role = 'admin')
    )
  );


-- =============================================================
-- 8. TASKS
-- Belong to a project; assigned to a profile
-- =============================================================
create table public.tasks (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects (id) on delete cascade not null,
  owner_id   uuid references public.profiles (id) on delete set null,
  name       text not null,
  code       text not null,
  status     text not null default 'default'
               check (status in ('default', 'overdue', 'approaching', 'on-track', 'complete')),
  stage      text not null default 'backlog'
               check (stage in ('backlog', 'todo', 'doing', 'done')),
  position   float8 not null default 0,
  created_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

-- All org members can see tasks for projects in their org
create policy "Org members can view tasks"
  on public.tasks for select
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = tasks.project_id and p.id = auth.uid()
    )
  );

create policy "Users can view their own tasks"
  on public.tasks for select
  using (owner_id = auth.uid());

create policy "Project members can create tasks"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );

create policy "Project members can update tasks"
  on public.tasks for update
  using (
    exists (
      select 1 from public.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );

create policy "Project members can delete tasks"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );


-- =============================================================
-- 9. MESSAGES
-- Per-project chat; visible to all org members
-- =============================================================
create table public.messages (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references public.projects (id) on delete cascade not null,
  sender_id       uuid references public.profiles (id) on delete set null,
  content         text not null,
  attachment_url  text,
  attachment_name text,
  attachment_type text,
  attachment_size int8,
  created_at      timestamptz default now() not null
);

alter table public.messages enable row level security;

-- Align with org-based access so all org members can read project messages
create policy "Org members can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = messages.project_id and p.id = auth.uid()
    )
  );

create policy "Project members can send messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_id = messages.project_id and profile_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

-- Enable realtime
alter publication supabase_realtime add table public.messages;


-- =============================================================
-- 10. STORAGE — chat attachments
-- =============================================================
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict do nothing;

create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-attachments');

create policy "Chat attachments are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-attachments');

create policy "Uploaders can delete their chat attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'chat-attachments' and owner = auth.uid());


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
