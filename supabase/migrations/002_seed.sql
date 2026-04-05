do $$
declare
  v_org_id      uuid;
  v_lalith_id   uuid;
  v_kaushik_id  uuid := gen_random_uuid();
  v_priya_id    uuid := gen_random_uuid();
  v_arjun_id    uuid := gen_random_uuid();

  v_cluster1_id uuid;  -- Elegant Design Co.
  v_cluster2_id uuid;  -- NovaTech Solutions
  v_cluster3_id uuid;  -- Bright Media Group

  -- EDC projects
  v_edc1_id uuid;  -- Brand Identity Refresh   (done)
  v_edc2_id uuid;  -- Design System Setup      (doing)
  v_edc3_id uuid;  -- Website Redesign         (todo)

  -- NVT projects
  v_nvt1_id uuid;  -- API Gateway Integration  (done)
  v_nvt2_id uuid;  -- Mobile Responsive        (doing)
  v_nvt3_id uuid;  -- Performance Optimisation (backlog)

  -- BMG projects
  v_bmg1_id uuid;  -- Social Media Dashboard   (done)
  v_bmg2_id uuid;  -- Email Campaign Templates (todo)
  v_bmg3_id uuid;  -- Content Strategy         (backlog)
begin

  -- -------------------------------------------------------
  -- ORGANIZATION
  -- -------------------------------------------------------
  insert into public.organizations (name)
  values ('Zeroxa Studio')
  returning id into v_org_id;


  -- -------------------------------------------------------
  -- LALITH — existing auth user, org admin
  -- -------------------------------------------------------
  select id into v_lalith_id
  from auth.users
  where email = 'lalithk3991@gmail.com';

  insert into public.profiles (id, email, name, org_id, role)
  values (v_lalith_id, 'lalithk3991@gmail.com', 'Lalith Kishore', v_org_id, 'admin')
  on conflict (id) do update
    set org_id = excluded.org_id,
        role   = excluded.role,
        name   = excluded.name;


  -- -------------------------------------------------------
  -- DUMMY TEAM MEMBERS
  -- Insert into auth.users, then upsert profiles
  -- (trigger may not fire for direct auth.users inserts)
  -- -------------------------------------------------------
  insert into auth.users (
    id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) values
    (v_kaushik_id, 'authenticated', 'authenticated',
     'kaushik@zeroxa.studio', crypt('Dummy@123', gen_salt('bf')),
     now(), '{"name":"Kaushik R"}'::jsonb, now(), now()),

    (v_priya_id, 'authenticated', 'authenticated',
     'priya@zeroxa.studio', crypt('Dummy@123', gen_salt('bf')),
     now(), '{"name":"Priya S"}'::jsonb, now(), now()),

    (v_arjun_id, 'authenticated', 'authenticated',
     'arjun@zeroxa.studio', crypt('Dummy@123', gen_salt('bf')),
     now(), '{"name":"Arjun M"}'::jsonb, now(), now());

  insert into public.profiles (id, email, name, org_id)
  values
    (v_kaushik_id, 'kaushik@zeroxa.studio', 'Kaushik R', v_org_id),
    (v_priya_id,   'priya@zeroxa.studio',   'Priya S',   v_org_id),
    (v_arjun_id,   'arjun@zeroxa.studio',   'Arjun M',   v_org_id)
  on conflict (id) do update
    set org_id = excluded.org_id,
        name   = excluded.name;


  -- -------------------------------------------------------
  -- CLUSTERS
  -- -------------------------------------------------------
  insert into public.clusters (org_id, name) values (v_org_id, 'Elegant Design Co.')  returning id into v_cluster1_id;
  insert into public.clusters (org_id, name) values (v_org_id, 'NovaTech Solutions')  returning id into v_cluster2_id;
  insert into public.clusters (org_id, name) values (v_org_id, 'Bright Media Group')  returning id into v_cluster3_id;


  -- -------------------------------------------------------
  -- PROJECTS
  -- -------------------------------------------------------
  insert into public.projects
    (org_id, cluster_id, owner_id, code, name, status, stage, position,
     planned_start, planned_end, description, sprint_cadence, timezone,
     tickets_enabled, time_tracking_enabled)
  values
    -- Elegant Design Co.
    (v_org_id, v_cluster1_id, v_lalith_id,  'EDC-001', 'Brand Identity Refresh',   'on-track',   'done',    1, '2026-01-10', '2026-02-15', 'Full rebrand including logo, typography, and colour palette.', 'bi-weekly', 'Asia/Kolkata', true,  false),
    (v_org_id, v_cluster1_id, v_kaushik_id, 'EDC-002', 'Design System Setup',      'on-track',   'doing',   2, '2026-02-01', '2026-04-30', 'Build a reusable component library in Figma and code.',       'bi-weekly', 'Asia/Kolkata', true,  true),
    (v_org_id, v_cluster1_id, v_priya_id,   'EDC-003', 'Website Redesign',         'approaching','todo',    3, '2026-04-10', '2026-06-01', 'Redesign the public-facing marketing site.',                  'weekly',    'Asia/Kolkata', true,  false),
    -- NovaTech Solutions
    (v_org_id, v_cluster2_id, v_arjun_id,   'NVT-001', 'API Gateway Integration',  'on-track',   'done',    1, '2026-01-20', '2026-03-05', 'Connect all microservices through a unified API gateway.',    'monthly',   'UTC',          true,  true),
    (v_org_id, v_cluster2_id, v_lalith_id,  'NVT-002', 'Mobile Responsive Layouts','overdue',    'doing',   2, '2026-02-15', '2026-04-01', 'Ensure all views are fully responsive across devices.',       'bi-weekly', 'UTC',          true,  true),
    (v_org_id, v_cluster2_id, v_kaushik_id, 'NVT-003', 'Performance Optimisation', 'default',    'backlog', 3, '2026-05-01', '2026-06-15', 'Audit and improve page load times and core web vitals.',     'bi-weekly', 'UTC',          false, false),
    -- Bright Media Group
    (v_org_id, v_cluster3_id, v_priya_id,   'BMG-001', 'Social Media Dashboard',   'on-track',   'done',    1, '2026-01-05', '2026-02-20', 'Analytics dashboard for all social channels.',               'weekly',    'Asia/Kolkata', true,  false),
    (v_org_id, v_cluster3_id, v_arjun_id,   'BMG-002', 'Email Campaign Templates', 'approaching','todo',    2, '2026-03-25', '2026-05-10', 'Design and code a library of reusable email templates.',     'bi-weekly', 'Asia/Kolkata', true,  false),
    (v_org_id, v_cluster3_id, v_lalith_id,  'BMG-003', 'Content Strategy Workshop','default',    'backlog', 3, '2026-06-01', '2026-07-15', 'Plan the Q3 content calendar and SEO strategy.',             'monthly',   'Asia/Kolkata', false, false);

  select id into v_edc1_id from public.projects where code = 'EDC-001';
  select id into v_edc2_id from public.projects where code = 'EDC-002';
  select id into v_edc3_id from public.projects where code = 'EDC-003';
  select id into v_nvt1_id from public.projects where code = 'NVT-001';
  select id into v_nvt2_id from public.projects where code = 'NVT-002';
  select id into v_nvt3_id from public.projects where code = 'NVT-003';
  select id into v_bmg1_id from public.projects where code = 'BMG-001';
  select id into v_bmg2_id from public.projects where code = 'BMG-002';
  select id into v_bmg3_id from public.projects where code = 'BMG-003';


  -- -------------------------------------------------------
  -- PROJECT MEMBERS
  -- Users are connected at project level
  -- -------------------------------------------------------
  insert into public.project_members (project_id, profile_id, role) values
    -- EDC-001
    (v_edc1_id, v_lalith_id,  'owner'),
    (v_edc1_id, v_priya_id,   'member'),
    (v_edc1_id, v_kaushik_id, 'member'),
    -- EDC-002
    (v_edc2_id, v_kaushik_id, 'owner'),
    (v_edc2_id, v_lalith_id,  'member'),
    (v_edc2_id, v_priya_id,   'member'),
    -- EDC-003
    (v_edc3_id, v_priya_id,   'owner'),
    (v_edc3_id, v_kaushik_id, 'member'),
    (v_edc3_id, v_lalith_id,  'viewer'),
    -- NVT-001
    (v_nvt1_id, v_arjun_id,   'owner'),
    (v_nvt1_id, v_lalith_id,  'member'),
    (v_nvt1_id, v_kaushik_id, 'member'),
    -- NVT-002
    (v_nvt2_id, v_lalith_id,  'owner'),
    (v_nvt2_id, v_kaushik_id, 'member'),
    (v_nvt2_id, v_arjun_id,   'member'),
    (v_nvt2_id, v_priya_id,   'viewer'),
    -- NVT-003
    (v_nvt3_id, v_kaushik_id, 'owner'),
    (v_nvt3_id, v_lalith_id,  'member'),
    (v_nvt3_id, v_arjun_id,   'member'),
    -- BMG-001
    (v_bmg1_id, v_priya_id,   'owner'),
    (v_bmg1_id, v_arjun_id,   'member'),
    (v_bmg1_id, v_lalith_id,  'viewer'),
    -- BMG-002
    (v_bmg2_id, v_arjun_id,   'owner'),
    (v_bmg2_id, v_priya_id,   'member'),
    (v_bmg2_id, v_lalith_id,  'member'),
    -- BMG-003
    (v_bmg3_id, v_lalith_id,  'owner'),
    (v_bmg3_id, v_priya_id,   'member'),
    (v_bmg3_id, v_arjun_id,   'member');


  -- -------------------------------------------------------
  -- TASKS (assigned to project members only)
  -- -------------------------------------------------------

  -- EDC-001: Brand Identity Refresh (project done)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_edc1_id, v_lalith_id,  'Kick-off stakeholder meeting',  'EDC-001-T1', 'on-track', 'done', 1),
    (v_edc1_id, v_priya_id,   'Competitor brand analysis',     'EDC-001-T2', 'on-track', 'done', 2),
    (v_edc1_id, v_kaushik_id, 'Logo concepts (3 directions)',  'EDC-001-T3', 'on-track', 'done', 3),
    (v_edc1_id, v_lalith_id,  'Final logo sign-off',           'EDC-001-T4', 'on-track', 'done', 4),
    (v_edc1_id, v_priya_id,   'Brand guidelines document',     'EDC-001-T5', 'on-track', 'done', 5);

  -- EDC-002: Design System Setup (project doing)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_edc2_id, v_kaushik_id, 'Audit existing components',     'EDC-002-T1', 'on-track',   'done',    1),
    (v_edc2_id, v_priya_id,   'Define token structure',        'EDC-002-T2', 'on-track',   'done',    2),
    (v_edc2_id, v_kaushik_id, 'Build Button component',        'EDC-002-T3', 'on-track',   'doing',   1),
    (v_edc2_id, v_lalith_id,  'Build Form components',         'EDC-002-T4', 'approaching','doing',   2),
    (v_edc2_id, v_priya_id,   'Storybook documentation',       'EDC-002-T5', 'default',    'todo',    1),
    (v_edc2_id, v_kaushik_id, 'Publish to npm',                'EDC-002-T6', 'default',    'backlog', 1);

  -- EDC-003: Website Redesign (project todo)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_edc3_id, v_priya_id,   'Gather content requirements',   'EDC-003-T1', 'default',    'todo',    1),
    (v_edc3_id, v_kaushik_id, 'Wireframes for all pages',      'EDC-003-T2', 'default',    'todo',    2),
    (v_edc3_id, v_priya_id,   'Homepage high-fidelity mockup', 'EDC-003-T3', 'approaching','backlog', 1),
    (v_edc3_id, v_kaushik_id, 'Frontend build',                'EDC-003-T4', 'default',    'backlog', 2);

  -- NVT-001: API Gateway Integration (project done)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_nvt1_id, v_arjun_id,   'Map existing service endpoints','NVT-001-T1', 'on-track', 'done', 1),
    (v_nvt1_id, v_lalith_id,  'Choose gateway solution',       'NVT-001-T2', 'on-track', 'done', 2),
    (v_nvt1_id, v_arjun_id,   'Configure rate limiting',       'NVT-001-T3', 'on-track', 'done', 3),
    (v_nvt1_id, v_kaushik_id, 'Auth middleware integration',   'NVT-001-T4', 'on-track', 'done', 4),
    (v_nvt1_id, v_arjun_id,   'Load test and sign-off',        'NVT-001-T5', 'on-track', 'done', 5);

  -- NVT-002: Mobile Responsive Layouts (project doing)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_nvt2_id, v_lalith_id,  'Inventory non-responsive views','NVT-002-T1', 'on-track',   'done',  1),
    (v_nvt2_id, v_kaushik_id, 'Fix navigation breakpoints',    'NVT-002-T2', 'overdue',    'doing', 1),
    (v_nvt2_id, v_lalith_id,  'Responsive tables and grids',   'NVT-002-T3', 'overdue',    'doing', 2),
    (v_nvt2_id, v_arjun_id,   'Touch target audit',            'NVT-002-T4', 'approaching','todo',  1),
    (v_nvt2_id, v_priya_id,   'Cross-device QA',               'NVT-002-T5', 'default',    'todo',  2);

  -- NVT-003: Performance Optimisation (project backlog)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_nvt3_id, v_kaushik_id, 'Lighthouse baseline audit',     'NVT-003-T1', 'default', 'backlog', 1),
    (v_nvt3_id, v_lalith_id,  'Image optimisation strategy',   'NVT-003-T2', 'default', 'backlog', 2),
    (v_nvt3_id, v_arjun_id,   'Bundle size analysis',          'NVT-003-T3', 'default', 'backlog', 3),
    (v_nvt3_id, v_kaushik_id, 'CDN configuration',             'NVT-003-T4', 'default', 'backlog', 4);

  -- BMG-001: Social Media Dashboard (project done)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_bmg1_id, v_priya_id,   'Connect platform APIs',         'BMG-001-T1', 'on-track', 'done', 1),
    (v_bmg1_id, v_arjun_id,   'Design dashboard layout',       'BMG-001-T2', 'on-track', 'done', 2),
    (v_bmg1_id, v_priya_id,   'Build analytics charts',        'BMG-001-T3', 'on-track', 'done', 3),
    (v_bmg1_id, v_lalith_id,  'Scheduled report emails',       'BMG-001-T4', 'on-track', 'done', 4),
    (v_bmg1_id, v_arjun_id,   'Client handover and training',  'BMG-001-T5', 'on-track', 'done', 5);

  -- BMG-002: Email Campaign Templates (project todo)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_bmg2_id, v_arjun_id,   'Define template categories',    'BMG-002-T1', 'default',    'todo',    1),
    (v_bmg2_id, v_priya_id,   'Design welcome email',          'BMG-002-T2', 'approaching','todo',    2),
    (v_bmg2_id, v_arjun_id,   'Design promotional email',      'BMG-002-T3', 'default',    'backlog', 1),
    (v_bmg2_id, v_lalith_id,  'Code HTML/CSS templates',       'BMG-002-T4', 'default',    'backlog', 2),
    (v_bmg2_id, v_priya_id,   'Cross-client email QA',         'BMG-002-T5', 'default',    'backlog', 3);

  -- BMG-003: Content Strategy Workshop (project backlog)
  insert into public.tasks (project_id, owner_id, name, code, status, stage, position) values
    (v_bmg3_id, v_lalith_id,  'Audit existing content',        'BMG-003-T1', 'default', 'backlog', 1),
    (v_bmg3_id, v_priya_id,   'Define target personas',        'BMG-003-T2', 'default', 'backlog', 2),
    (v_bmg3_id, v_arjun_id,   'Q3 content calendar draft',     'BMG-003-T3', 'default', 'backlog', 3),
    (v_bmg3_id, v_lalith_id,  'SEO keyword research',          'BMG-003-T4', 'default', 'backlog', 4);


  -- -------------------------------------------------------
  -- ORG INVITES (pending)
  -- -------------------------------------------------------
  insert into public.org_invites (org_id, email, invited_by) values
    (v_org_id, 'meena@example.com', v_lalith_id),
    (v_org_id, 'ravi@example.com',  v_lalith_id);

end;
$$;
