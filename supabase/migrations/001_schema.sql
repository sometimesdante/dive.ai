-- =============================================================
-- Dive database setup
--
-- Everything lives in the "dive" schema so the Supabase project
-- can be shared with other apps. This file is safe to re-run on a
-- database with real data: tables and the schema are only created
-- if missing, functions are replaced, and only triggers and
-- policies are dropped and recreated. Nothing outside the dive
-- schema is touched except Dive's own auth trigger, realtime
-- publication entry, storage bucket and storage policies.
-- =============================================================

create schema if not exists dive;


-- =============================================================
-- 1. ORGANIZATIONS
-- =============================================================
create table if not exists dive.organizations (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table dive.organizations enable row level security;

-- Org RLS policies are defined below, after profiles exists.


-- =============================================================
-- 2. PROFILES
-- 1-to-1 with auth.users; auto-created via trigger for Dive sign-ups
-- =============================================================
create table if not exists dive.profiles (
  id         uuid references auth.users (id) on delete cascade primary key,
  org_id     uuid references dive.organizations (id) on delete set null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  email      text,
  name       text,
  phone      text,
  address    text,
  created_at timestamptz default now() not null
);

alter table dive.profiles enable row level security;

-- Helper: returns the org_id of the current user without triggering RLS.
-- Must be defined after profiles exists (SQL functions are validated at creation).
create or replace function dive.get_auth_org_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select org_id from dive.profiles where id = auth.uid()
$$;

drop policy if exists "Users can view own profile" on dive.profiles;
create policy "Users can view own profile"
  on dive.profiles for select
  using (auth.uid() = id);

drop policy if exists "Org members can view profiles in same org" on dive.profiles;
create policy "Org members can view profiles in same org"
  on dive.profiles for select
  using (
    org_id is not null
    and org_id = dive.get_auth_org_id()
  );

drop policy if exists "Users can update own profile" on dive.profiles;
create policy "Users can update own profile"
  on dive.profiles for update
  using (auth.uid() = id);


-- Trigger: auto-insert a profile when a new auth user signs up through Dive.
-- auth.users is shared with other apps, so only users whose metadata has
-- app = 'dive' get a profile.
create or replace function dive.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'dive' then
    insert into dive.profiles (id, email, name, phone, address)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'phone',
      new.raw_user_meta_data ->> 'address'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists dive_on_auth_user_created on auth.users;

create trigger dive_on_auth_user_created
  after insert on auth.users
  for each row execute function dive.handle_new_user();


-- =============================================================
-- 3. ORGANIZATIONS RLS
-- Defined after profiles because policies reference it
-- =============================================================
drop policy if exists "Authenticated users can create organizations" on dive.organizations;
create policy "Authenticated users can create organizations"
  on dive.organizations for insert
  with check (auth.uid() is not null);

drop policy if exists "Members can view own organization" on dive.organizations;
create policy "Members can view own organization"
  on dive.organizations for select
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = organizations.id
    )
  );

drop policy if exists "Admins can update own organization" on dive.organizations;
create policy "Admins can update own organization"
  on dive.organizations for update
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = organizations.id and role = 'admin'
    )
  );


-- =============================================================
-- 4. ORG INVITES
-- =============================================================
create table if not exists dive.org_invites (
  id          uuid default gen_random_uuid() primary key,
  org_id      uuid references dive.organizations (id) on delete cascade not null,
  email       text not null,
  token       uuid default gen_random_uuid() not null unique,
  invited_by  uuid references dive.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz default now() not null
);

alter table dive.org_invites enable row level security;

drop policy if exists "Admins can view org invites" on dive.org_invites;
create policy "Admins can view org invites"
  on dive.org_invites for select
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );

drop policy if exists "Admins can create invites" on dive.org_invites;
create policy "Admins can create invites"
  on dive.org_invites for insert
  with check (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );

drop policy if exists "Admins can delete invites" on dive.org_invites;
create policy "Admins can delete invites"
  on dive.org_invites for delete
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = org_invites.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 5. CLUSTERS
-- Clients that an organization is serving
-- =============================================================
create table if not exists dive.clusters (
  id         uuid default gen_random_uuid() primary key,
  org_id     uuid references dive.organizations (id) on delete cascade not null,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table dive.clusters enable row level security;

drop policy if exists "Members can view org clusters" on dive.clusters;
create policy "Members can view org clusters"
  on dive.clusters for select
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

drop policy if exists "Members can create clusters" on dive.clusters;
create policy "Members can create clusters"
  on dive.clusters for insert
  with check (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

drop policy if exists "Members can update clusters" on dive.clusters;
create policy "Members can update clusters"
  on dive.clusters for update
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = clusters.org_id
    )
  );

drop policy if exists "Admins can delete clusters" on dive.clusters;
create policy "Admins can delete clusters"
  on dive.clusters for delete
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = clusters.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 6. PROJECTS
-- Belong to an org and optionally a cluster
-- =============================================================
create table if not exists dive.projects (
  id                    uuid default gen_random_uuid() primary key,
  org_id                uuid references dive.organizations (id) on delete cascade not null,
  cluster_id            uuid references dive.clusters (id) on delete set null,
  owner_id              uuid references dive.profiles (id) on delete set null,
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

alter table dive.projects enable row level security;

drop policy if exists "Members can view org projects" on dive.projects;
create policy "Members can view org projects"
  on dive.projects for select
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

drop policy if exists "Members can create projects" on dive.projects;
create policy "Members can create projects"
  on dive.projects for insert
  with check (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

drop policy if exists "Members can update projects" on dive.projects;
create policy "Members can update projects"
  on dive.projects for update
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = projects.org_id
    )
  );

drop policy if exists "Admins can delete projects" on dive.projects;
create policy "Admins can delete projects"
  on dive.projects for delete
  using (
    exists (
      select 1 from dive.profiles
      where id = auth.uid() and org_id = projects.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 7. PROJECT MEMBERS
-- Users associated at the project level
-- =============================================================
create table if not exists dive.project_members (
  project_id uuid references dive.projects (id) on delete cascade not null,
  profile_id uuid references dive.profiles (id) on delete cascade not null,
  role       text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  primary key (project_id, profile_id)
);

alter table dive.project_members enable row level security;

drop policy if exists "Org members can view project membership" on dive.project_members;
create policy "Org members can view project membership"
  on dive.project_members for select
  using (
    exists (
      select 1 from dive.profiles p
      join dive.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id and p.id = auth.uid()
    )
  );

drop policy if exists "Project owner or org admin can manage members" on dive.project_members;
create policy "Project owner or org admin can manage members"
  on dive.project_members for all
  using (
    exists (
      select 1 from dive.profiles p
      join dive.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id
        and p.id = auth.uid()
        and (pr.owner_id = p.id or p.role = 'admin')
    )
  );


-- =============================================================
-- 8. TASKS
-- Belong to a project; assigned to a profile
-- =============================================================
create table if not exists dive.tasks (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references dive.projects (id) on delete cascade not null,
  owner_id   uuid references dive.profiles (id) on delete set null,
  name       text not null,
  code       text not null,
  status     text not null default 'default'
               check (status in ('default', 'overdue', 'approaching', 'on-track', 'complete')),
  stage      text not null default 'backlog'
               check (stage in ('backlog', 'todo', 'doing', 'done')),
  position   float8 not null default 0,
  created_at timestamptz default now() not null
);

alter table dive.tasks enable row level security;

-- All org members can see tasks for projects in their org
drop policy if exists "Org members can view tasks" on dive.tasks;
create policy "Org members can view tasks"
  on dive.tasks for select
  using (
    exists (
      select 1 from dive.profiles p
      join dive.projects pr on pr.org_id = p.org_id
      where pr.id = tasks.project_id and p.id = auth.uid()
    )
  );

drop policy if exists "Users can view their own tasks" on dive.tasks;
create policy "Users can view their own tasks"
  on dive.tasks for select
  using (owner_id = auth.uid());

drop policy if exists "Project members can create tasks" on dive.tasks;
create policy "Project members can create tasks"
  on dive.tasks for insert
  with check (
    exists (
      select 1 from dive.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );

drop policy if exists "Project members can update tasks" on dive.tasks;
create policy "Project members can update tasks"
  on dive.tasks for update
  using (
    exists (
      select 1 from dive.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );

drop policy if exists "Project members can delete tasks" on dive.tasks;
create policy "Project members can delete tasks"
  on dive.tasks for delete
  using (
    exists (
      select 1 from dive.project_members
      where project_id = tasks.project_id and profile_id = auth.uid()
    )
  );


-- =============================================================
-- 9. MESSAGES
-- Per-project chat; visible to all org members
-- =============================================================
create table if not exists dive.messages (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references dive.projects (id) on delete cascade not null,
  sender_id       uuid references dive.profiles (id) on delete set null,
  content         text not null,
  attachment_url  text,
  attachment_name text,
  attachment_type text,
  attachment_size int8,
  created_at      timestamptz default now() not null
);

alter table dive.messages enable row level security;

-- Align with org-based access so all org members can read project messages
drop policy if exists "Org members can view messages" on dive.messages;
create policy "Org members can view messages"
  on dive.messages for select
  using (
    exists (
      select 1 from dive.profiles p
      join dive.projects pr on pr.org_id = p.org_id
      where pr.id = messages.project_id and p.id = auth.uid()
    )
  );

drop policy if exists "Project members can send messages" on dive.messages;
create policy "Project members can send messages"
  on dive.messages for insert
  with check (
    exists (
      select 1 from dive.project_members
      where project_id = messages.project_id and profile_id = auth.uid()
    )
    and sender_id = auth.uid()
  );

-- Enable realtime (skip if already in the publication)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'dive'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table dive.messages;
  end if;
end;
$$;


-- =============================================================
-- 10. NOTES
-- Per-project markdown notes; each user owns their own notes
-- =============================================================
create table if not exists dive.notes (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references dive.projects (id) on delete cascade not null,
  owner_id   uuid references dive.profiles (id) on delete cascade not null,
  title      text not null default 'Untitled',
  content    text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table dive.notes enable row level security;

drop policy if exists "Note owners can view their notes" on dive.notes;
create policy "Note owners can view their notes"
  on dive.notes for select
  using (owner_id = auth.uid());

drop policy if exists "Note owners can create notes" on dive.notes;
create policy "Note owners can create notes"
  on dive.notes for insert
  with check (owner_id = auth.uid());

drop policy if exists "Note owners can update their notes" on dive.notes;
create policy "Note owners can update their notes"
  on dive.notes for update
  using (owner_id = auth.uid());

drop policy if exists "Note owners can delete their notes" on dive.notes;
create policy "Note owners can delete their notes"
  on dive.notes for delete
  using (owner_id = auth.uid());


-- =============================================================
-- 11. NOTE VERSIONS
-- Snapshot-based version history for notes
-- =============================================================
create table if not exists dive.note_versions (
  id         uuid default gen_random_uuid() primary key,
  note_id    uuid references dive.notes (id) on delete cascade not null,
  content    text not null,
  title      text not null,
  created_at timestamptz default now() not null
);

alter table dive.note_versions enable row level security;

drop policy if exists "Note owners can view their note versions" on dive.note_versions;
create policy "Note owners can view their note versions"
  on dive.note_versions for select
  using (
    exists (
      select 1 from dive.notes
      where id = note_versions.note_id and owner_id = auth.uid()
    )
  );

drop policy if exists "Note owners can create note versions" on dive.note_versions;
create policy "Note owners can create note versions"
  on dive.note_versions for insert
  with check (
    exists (
      select 1 from dive.notes
      where id = note_versions.note_id and owner_id = auth.uid()
    )
  );


-- =============================================================
-- 12. GRANTS
-- Table privileges mirror the RLS policies above. anon has no
-- policies, so it only gets schema usage. service_role bypasses
-- RLS and is used by server actions for invites and onboarding.
-- =============================================================
grant usage on schema dive to anon, authenticated, service_role;

revoke all on all tables in schema dive from anon;

grant select, insert, update         on dive.organizations   to authenticated;
grant select, update                 on dive.profiles        to authenticated;
grant select, insert, delete         on dive.org_invites     to authenticated;
grant select, insert, update, delete on dive.clusters        to authenticated;
grant select, insert, update, delete on dive.projects        to authenticated;
grant select, insert, update, delete on dive.project_members to authenticated;
grant select, insert, update, delete on dive.tasks           to authenticated;
grant select, insert                 on dive.messages        to authenticated;
grant select, insert, update, delete on dive.notes           to authenticated;
grant select, insert                 on dive.note_versions   to authenticated;

grant all on all tables    in schema dive to service_role;
grant all on all sequences in schema dive to service_role;

alter default privileges in schema dive grant all on tables    to service_role;
alter default privileges in schema dive grant all on sequences to service_role;
alter default privileges in schema dive grant execute on functions to service_role;

-- Functions are executable by PUBLIC by default; narrow that down.
revoke execute on function dive.get_auth_org_id() from public, anon;
grant  execute on function dive.get_auth_org_id() to authenticated, service_role;

revoke execute on function dive.handle_new_user() from public, anon, authenticated;
grant  execute on function dive.handle_new_user() to service_role;


-- =============================================================
-- 13. STORAGE — bucket "dive", chat files under chat-attachments/
-- =============================================================
insert into storage.buckets (id, name, public)
values ('dive', 'dive', true)
on conflict do nothing;

drop policy if exists "dive: upload chat attachments" on storage.objects;
create policy "dive: upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dive'
    and (storage.foldername(name))[1] = 'chat-attachments'
  );

drop policy if exists "dive: read chat attachments" on storage.objects;
create policy "dive: read chat attachments"
  on storage.objects for select
  to public
  using (
    bucket_id = 'dive'
    and (storage.foldername(name))[1] = 'chat-attachments'
  );

drop policy if exists "dive: delete own chat attachments" on storage.objects;
create policy "dive: delete own chat attachments"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dive'
    and (storage.foldername(name))[1] = 'chat-attachments'
    and owner = auth.uid()
  );
