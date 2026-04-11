do $$
declare
  v_org_id     uuid;
  v_lalith_id  uuid;
  v_kaushik_id uuid := gen_random_uuid();
  v_priya_id   uuid := gen_random_uuid();

  v_cluster1_id uuid;  -- Elegant Design Co.
  v_cluster2_id uuid;  -- NovaTech Solutions
  v_cluster3_id uuid;  -- Bright Media Group

  v_edc1_id uuid;  -- Brand Identity Refresh   (done)
  v_edc2_id uuid;  -- Design System Setup      (doing)
  v_nvt1_id uuid;  -- API Gateway Integration  (todo)
  v_nvt2_id uuid;  -- Mobile Responsive        (doing)
  v_bmg1_id uuid;  -- Social Media Dashboard   (backlog)
begin

  -- -------------------------------------------------------
  -- ORGANIZATION
  -- -------------------------------------------------------
  insert into public.organizations (name)
  values ('Zeroxa Studio')
  returning id into v_org_id;


  -- -------------------------------------------------------
  -- LALITH — create or reuse auth user, org admin
  -- -------------------------------------------------------
  select id into v_lalith_id
  from auth.users
  where email = 'lalithk3991@gmail.com';

  if v_lalith_id is null then
    v_lalith_id := gen_random_uuid();
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at
    ) values (
      v_lalith_id, 'authenticated', 'authenticated',
      'lalithk3991@gmail.com', crypt('warcraft123', gen_salt('bf')),
      now(), '{"name":"Lalith Kishore"}'::jsonb, now(), now()
    );
  end if;

  insert into public.profiles (id, email, name, org_id, role)
  values (v_lalith_id, 'lalithk3991@gmail.com', 'Lalith Kishore', v_org_id, 'admin')
  on conflict (id) do update
    set org_id = excluded.org_id,
        role   = excluded.role,
        name   = excluded.name;


  -- -------------------------------------------------------
  -- DUMMY TEAM MEMBERS — create or reuse auth users
  -- -------------------------------------------------------
  select id into v_kaushik_id from auth.users where email = 'kaushik@zeroxa.studio';
  if v_kaushik_id is null then
    v_kaushik_id := gen_random_uuid();
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at
    ) values (
      v_kaushik_id, 'authenticated', 'authenticated',
      'kaushik@zeroxa.studio', crypt('Dummy@123', gen_salt('bf')),
      now(), '{"name":"Kaushik R"}'::jsonb, now(), now()
    );
  end if;

  select id into v_priya_id from auth.users where email = 'priya@zeroxa.studio';
  if v_priya_id is null then
    v_priya_id := gen_random_uuid();
    insert into auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at
    ) values (
      v_priya_id, 'authenticated', 'authenticated',
      'priya@zeroxa.studio', crypt('Dummy@123', gen_salt('bf')),
      now(), '{"name":"Priya S"}'::jsonb, now(), now()
    );
  end if;

  insert into public.profiles (id, email, name, org_id, role)
  values
    (v_kaushik_id, 'kaushik@zeroxa.studio', 'Kaushik R', v_org_id, 'member'),
    (v_priya_id,   'priya@zeroxa.studio',   'Priya S',   v_org_id, 'member')
  on conflict (id) do update
    set org_id = excluded.org_id,
        name   = excluded.name,
        role   = excluded.role;


  -- -------------------------------------------------------
  -- CLUSTERS
  -- -------------------------------------------------------
  insert into public.clusters (org_id, name) values (v_org_id, 'Elegant Design Co.')  returning id into v_cluster1_id;
  insert into public.clusters (org_id, name) values (v_org_id, 'NovaTech Solutions')  returning id into v_cluster2_id;
  insert into public.clusters (org_id, name) values (v_org_id, 'Bright Media Group')  returning id into v_cluster3_id;


  -- -------------------------------------------------------
  -- PROJECTS  (5 projects across 3 clusters)
  -- -------------------------------------------------------
  insert into public.projects
    (org_id, cluster_id, owner_id, code, name, status, stage, position,
     planned_start, planned_end, description, sprint_cadence, timezone,
     tickets_enabled, time_tracking_enabled)
  values
    (v_org_id, v_cluster1_id, v_lalith_id,  'EDC-001', 'Brand Identity Refresh',   'on-track',   'done',    1, '2026-01-10', '2026-02-15', 'Full rebrand including logo, typography, and colour palette.',  'bi-weekly', 'Asia/Kolkata', true,  false),
    (v_org_id, v_cluster1_id, v_kaushik_id, 'EDC-002', 'Design System Setup',      'on-track',   'doing',   2, '2026-02-01', '2026-04-30', 'Build a reusable component library in Figma and code.',        'bi-weekly', 'Asia/Kolkata', true,  true),
    (v_org_id, v_cluster2_id, v_lalith_id,  'NVT-001', 'API Gateway Integration',  'approaching','todo',    1, '2026-04-15', '2026-06-01', 'Connect all microservices through a unified API gateway.',     'monthly',   'UTC',          true,  true),
    (v_org_id, v_cluster2_id, v_kaushik_id, 'NVT-002', 'Mobile Responsive Layouts','overdue',    'doing',   2, '2026-02-15', '2026-04-01', 'Ensure all views are fully responsive across devices.',        'bi-weekly', 'UTC',          true,  true),
    (v_org_id, v_cluster3_id, v_priya_id,   'BMG-001', 'Social Media Dashboard',   'default',    'backlog', 1, '2026-06-01', '2026-07-30', 'Analytics dashboard aggregating all social media channels.',   'weekly',    'Asia/Kolkata', false, false);

  select id into v_edc1_id from public.projects where code = 'EDC-001' and org_id = v_org_id;
  select id into v_edc2_id from public.projects where code = 'EDC-002' and org_id = v_org_id;
  select id into v_nvt1_id from public.projects where code = 'NVT-001' and org_id = v_org_id;
  select id into v_nvt2_id from public.projects where code = 'NVT-002' and org_id = v_org_id;
  select id into v_bmg1_id from public.projects where code = 'BMG-001' and org_id = v_org_id;


  -- -------------------------------------------------------
  -- PROJECT MEMBERS
  -- -------------------------------------------------------
  insert into public.project_members (project_id, profile_id, role) values
    (v_edc1_id, v_lalith_id,  'owner'),
    (v_edc1_id, v_kaushik_id, 'member'),
    (v_edc1_id, v_priya_id,   'viewer'),

    (v_edc2_id, v_kaushik_id, 'owner'),
    (v_edc2_id, v_lalith_id,  'member'),
    (v_edc2_id, v_priya_id,   'member'),

    (v_nvt1_id, v_lalith_id,  'owner'),
    (v_nvt1_id, v_priya_id,   'member'),
    (v_nvt1_id, v_kaushik_id, 'viewer'),

    (v_nvt2_id, v_kaushik_id, 'owner'),
    (v_nvt2_id, v_lalith_id,  'member'),
    (v_nvt2_id, v_priya_id,   'member'),

    (v_bmg1_id, v_priya_id,   'owner'),
    (v_bmg1_id, v_lalith_id,  'member'),
    (v_bmg1_id, v_kaushik_id, 'member');


  -- -------------------------------------------------------
  -- TASKS — 2 tasks per stage (backlog, todo, doing, done)
  --         for each of the 5 projects = 8 tasks × 5 = 40 tasks
  -- -------------------------------------------------------

  -- EDC-001: Brand Identity Refresh (project stage: done)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_edc1_id, v_lalith_id,  'Kick-off stakeholder meeting',      'EDC-T001', 'on-track', 'done',    1),
    (v_edc1_id, v_priya_id,   'Competitor brand analysis',         'EDC-T002', 'on-track', 'done',    2),
    (v_edc1_id, v_kaushik_id, 'Logo concepts — 3 directions',      'EDC-T003', 'on-track', 'doing',   1),
    (v_edc1_id, v_lalith_id,  'Finalise colour palette',           'EDC-T004', 'on-track', 'doing',   2),
    (v_edc1_id, v_priya_id,   'Brand guidelines document',         'EDC-T005', 'default',  'todo',    1),
    (v_edc1_id, v_kaushik_id, 'Typography selection',              'EDC-T006', 'default',  'todo',    2),
    (v_edc1_id, v_lalith_id,  'Final logo sign-off',               'EDC-T007', 'default',  'backlog', 1),
    (v_edc1_id, v_priya_id,   'Deliver brand asset pack',          'EDC-T008', 'default',  'backlog', 2);

  -- EDC-002: Design System Setup (project stage: doing)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_edc2_id, v_kaushik_id, 'Audit existing components',         'EDC-T009', 'on-track',   'done',    1),
    (v_edc2_id, v_priya_id,   'Define design token structure',     'EDC-T010', 'on-track',   'done',    2),
    (v_edc2_id, v_kaushik_id, 'Build Button component',            'EDC-T011', 'on-track',   'doing',   1),
    (v_edc2_id, v_lalith_id,  'Build Form components',             'EDC-T012', 'approaching','doing',   2),
    (v_edc2_id, v_priya_id,   'Storybook documentation',           'EDC-T013', 'default',    'todo',    1),
    (v_edc2_id, v_kaushik_id, 'Accessibility audit',               'EDC-T014', 'default',    'todo',    2),
    (v_edc2_id, v_lalith_id,  'Publish package to npm',            'EDC-T015', 'default',    'backlog', 1),
    (v_edc2_id, v_priya_id,   'Write migration guide',             'EDC-T016', 'default',    'backlog', 2);

  -- NVT-001: API Gateway Integration (project stage: todo)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_nvt1_id, v_lalith_id,  'Map existing service endpoints',    'NVT-T001', 'on-track',   'done',    1),
    (v_nvt1_id, v_priya_id,   'Evaluate gateway solutions',        'NVT-T002', 'on-track',   'done',    2),
    (v_nvt1_id, v_kaushik_id, 'Configure rate limiting rules',     'NVT-T003', 'approaching','doing',   1),
    (v_nvt1_id, v_lalith_id,  'Auth middleware integration',       'NVT-T004', 'approaching','doing',   2),
    (v_nvt1_id, v_priya_id,   'Set up request logging',            'NVT-T005', 'default',    'todo',    1),
    (v_nvt1_id, v_kaushik_id, 'Define error response standards',   'NVT-T006', 'default',    'todo',    2),
    (v_nvt1_id, v_lalith_id,  'Load test and sign-off',            'NVT-T007', 'default',    'backlog', 1),
    (v_nvt1_id, v_priya_id,   'Write API gateway runbook',         'NVT-T008', 'default',    'backlog', 2);

  -- NVT-002: Mobile Responsive Layouts (project stage: doing)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_nvt2_id, v_kaushik_id, 'Inventory non-responsive views',    'NVT-T009', 'on-track',   'done',    1),
    (v_nvt2_id, v_lalith_id,  'Establish responsive breakpoints',  'NVT-T010', 'on-track',   'done',    2),
    (v_nvt2_id, v_kaushik_id, 'Fix navigation on mobile',          'NVT-T011', 'overdue',    'doing',   1),
    (v_nvt2_id, v_priya_id,   'Responsive tables and grids',       'NVT-T012', 'overdue',    'doing',   2),
    (v_nvt2_id, v_lalith_id,  'Touch target audit',                'NVT-T013', 'approaching','todo',    1),
    (v_nvt2_id, v_kaushik_id, 'Review font scaling across sizes',  'NVT-T014', 'default',    'todo',    2),
    (v_nvt2_id, v_priya_id,   'Cross-device QA',                   'NVT-T015', 'default',    'backlog', 1),
    (v_nvt2_id, v_lalith_id,  'Client sign-off on mobile views',   'NVT-T016', 'default',    'backlog', 2);

  -- BMG-001: Social Media Dashboard (project stage: backlog)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_bmg1_id, v_priya_id,   'Define KPI requirements',           'BMG-T001', 'on-track', 'done',    1),
    (v_bmg1_id, v_lalith_id,  'Evaluate social platform APIs',     'BMG-T002', 'on-track', 'done',    2),
    (v_bmg1_id, v_kaushik_id, 'Wireframe dashboard layout',        'BMG-T003', 'default',  'doing',   1),
    (v_bmg1_id, v_priya_id,   'Design chart components',           'BMG-T004', 'default',  'doing',   2),
    (v_bmg1_id, v_lalith_id,  'Connect Instagram API',             'BMG-T005', 'default',  'todo',    1),
    (v_bmg1_id, v_kaushik_id, 'Connect LinkedIn API',              'BMG-T006', 'default',  'todo',    2),
    (v_bmg1_id, v_priya_id,   'Build analytics charts',            'BMG-T007', 'default',  'backlog', 1),
    (v_bmg1_id, v_lalith_id,  'Scheduled report emails',           'BMG-T008', 'default',  'backlog', 2);


  -- -------------------------------------------------------
  -- ORG INVITES (pending)
  -- -------------------------------------------------------
  insert into public.org_invites (org_id, email, invited_by) values
    (v_org_id, 'arjun@example.com', v_lalith_id),
    (v_org_id, 'meena@example.com', v_lalith_id);

end;
$$;
