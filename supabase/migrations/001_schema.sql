-- =============================================================
-- 1. ORGANIZATIONS
-- =============================================================
create table public.organizations (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now() not null
);

alter table public.organizations enable row level security;


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

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

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
-- 3. ORGANIZATIONS RLS
-- Defined after profiles because policies reference it
-- =============================================================
create policy "Members can view own organization"
  on public.organizations for select
  using (
    auth.uid() in (
      select id from public.profiles where org_id = organizations.id
    )
  );

create policy "Admins can update own organization"
  on public.organizations for update
  using (
    auth.uid() in (
      select id from public.profiles where org_id = organizations.id and role = 'admin'
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
    auth.uid() in (
      select id from public.profiles where org_id = org_invites.org_id and role = 'admin'
    )
  );

create policy "Admins can create invites"
  on public.org_invites for insert
  with check (
    auth.uid() in (
      select id from public.profiles where org_id = org_invites.org_id and role = 'admin'
    )
  );

create policy "Admins can delete invites"
  on public.org_invites for delete
  using (
    auth.uid() in (
      select id from public.profiles where org_id = org_invites.org_id and role = 'admin'
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
    auth.uid() in (
      select id from public.profiles where org_id = clusters.org_id
    )
  );

create policy "Members can create clusters"
  on public.clusters for insert
  with check (
    auth.uid() in (
      select id from public.profiles where org_id = clusters.org_id
    )
  );

create policy "Members can update clusters"
  on public.clusters for update
  using (
    auth.uid() in (
      select id from public.profiles where org_id = clusters.org_id
    )
  );

create policy "Admins can delete clusters"
  on public.clusters for delete
  using (
    auth.uid() in (
      select id from public.profiles where org_id = clusters.org_id and role = 'admin'
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
    auth.uid() in (
      select id from public.profiles where org_id = projects.org_id
    )
  );

create policy "Members can create projects"
  on public.projects for insert
  with check (
    auth.uid() in (
      select id from public.profiles where org_id = projects.org_id
    )
  );

create policy "Members can update projects"
  on public.projects for update
  using (
    auth.uid() in (
      select id from public.profiles where org_id = projects.org_id
    )
  );

create policy "Admins can delete projects"
  on public.projects for delete
  using (
    auth.uid() in (
      select id from public.profiles where org_id = projects.org_id and role = 'admin'
    )
  );


-- =============================================================
-- 7. PROJECT MEMBERS
-- Users are associated at the project level
-- =============================================================
create table public.project_members (
  project_id uuid references public.projects (id) on delete cascade not null,
  profile_id uuid references public.profiles (id) on delete cascade not null,
  role       text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  primary key (project_id, profile_id)
);

alter table public.project_members enable row level security;

create policy "Project members can view membership"
  on public.project_members for select
  using (
    exists (
      select 1 from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id
        and p.id = auth.uid()
    )
  );

create policy "Project owner or org admin can manage members"
  on public.project_members for all
  using (
    auth.uid() in (
      select p.id from public.profiles p
      join public.projects pr on pr.org_id = p.org_id
      where pr.id = project_members.project_id
        and (pr.owner_id = p.id or p.role = 'admin')
    )
  );


-- =============================================================
-- 8. TASKS
-- Belong to a project; assigned to a project member
-- =============================================================
create table public.tasks (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects (id) on delete cascade not null,
  owner_id   uuid references public.profiles (id) on delete set null,
  name       text not null,
  code       text not null,
  status     text not null default 'default'
               check (status in ('default', 'overdue', 'approaching', 'on-track')),
  stage      text not null default 'backlog'
               check (stage in ('backlog', 'todo', 'doing', 'done')),
  position   float8 not null default 0,
  created_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Project members can view tasks"
  on public.tasks for select
  using (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = tasks.project_id
    )
  );

create policy "Users can view their own tasks"
  on public.tasks for select
  using (owner_id = auth.uid());

create policy "Project members can create tasks"
  on public.tasks for insert
  with check (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = tasks.project_id
    )
  );

create policy "Project members can update tasks"
  on public.tasks for update
  using (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = tasks.project_id
    )
  );

create policy "Project members can delete tasks"
  on public.tasks for delete
  using (
    auth.uid() in (
      select profile_id from public.project_members
      where project_id = tasks.project_id
    )
  );
