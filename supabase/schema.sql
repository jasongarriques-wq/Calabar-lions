-- Calabar Lions — Supabase schema
-- Run with: supabase db push  (or paste into the SQL editor)

-------------------------------------------------------------------------------
-- Extensions
-------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-------------------------------------------------------------------------------
-- Enums
-------------------------------------------------------------------------------
do $$ begin
  create type user_role as enum (
    'student', 'teacher', 'admin', 'prefect', 'house_captain',
    'club_leader', 'coach', 'alumni', 'parent'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type track as enum ('csec', 'cape', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type group_type as enum (
    'house', 'form', 'class', 'subject', 'sba', 'club', 'sport', 'alumni'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type sba_status as enum ('not_started', 'in_progress', 'submitted', 'graded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

-------------------------------------------------------------------------------
-- Schools (multi-tenant ready; single row in MVP)
-------------------------------------------------------------------------------
create table if not exists schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Calabar High School',
  city text default 'Kingston',
  country text default 'Jamaica',
  created_at timestamptz not null default now()
);

insert into schools (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Calabar High School')
on conflict (id) do nothing;

-------------------------------------------------------------------------------
-- Academic years
-------------------------------------------------------------------------------
create table if not exists academic_years (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  label text not null,                  -- e.g. "2026/2027"
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  unique (school_id, label)
);

-------------------------------------------------------------------------------
-- Houses
-------------------------------------------------------------------------------
create table if not exists houses (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  motto text,
  color text,                            -- hex, e.g. "#137c3d"
  emblem_url text,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

insert into houses (school_id, name, motto, color) values
  ('00000000-0000-0000-0000-000000000001', 'Manning', 'Strength in unity', '#137c3d'),
  ('00000000-0000-0000-0000-000000000001', 'Cunningham', 'Knowledge is power', '#0c4d28'),
  ('00000000-0000-0000-0000-000000000001', 'Lumb', 'Honour above all', '#d4af37'),
  ('00000000-0000-0000-0000-000000000001', 'Davis', 'Lions never fall', '#7c5e1b')
on conflict (school_id, name) do nothing;

-------------------------------------------------------------------------------
-- Classes (e.g. 4A, 5R, L6S2)
-------------------------------------------------------------------------------
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  academic_year_id uuid references academic_years(id) on delete set null,
  name text not null,                    -- "4A"
  form text not null,                    -- "4"
  form_teacher_id uuid,                  -- references profiles(id)
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Subjects (CSEC / CAPE catalog)
-------------------------------------------------------------------------------
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,             -- "MATH", "POB"
  name text not null,
  track track not null default 'csec'
);

insert into subjects (code, name, track) values
  ('MATH', 'Mathematics', 'csec'),
  ('ENG-A', 'English A', 'csec'),
  ('ENG-B', 'English B', 'csec'),
  ('POB', 'Principles of Business', 'csec'),
  ('POA', 'Principles of Accounts', 'csec'),
  ('BIO', 'Biology', 'csec'),
  ('CHEM', 'Chemistry', 'csec'),
  ('PHY', 'Physics', 'csec'),
  ('IT', 'Information Technology', 'csec'),
  ('HIST', 'Caribbean History', 'csec'),
  ('GEO', 'Geography', 'csec'),
  ('SOC', 'Social Studies', 'csec'),
  ('PURE-MATH', 'Pure Mathematics', 'cape'),
  ('APP-MATH', 'Applied Mathematics', 'cape'),
  ('CAPE-BIO', 'Biology (CAPE)', 'cape'),
  ('CAPE-CHEM', 'Chemistry (CAPE)', 'cape'),
  ('CAPE-PHY', 'Physics (CAPE)', 'cape'),
  ('COMS', 'Communication Studies', 'cape'),
  ('CARIB', 'Caribbean Studies', 'cape')
on conflict (code) do nothing;

-------------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-------------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references schools(id) on delete set null
    default '00000000-0000-0000-0000-000000000001',
  role user_role not null default 'student',
  full_name text,
  display_name text,
  student_id text,                       -- optional
  date_of_birth date,
  -- is_minor was a generated column; compute in the app from date_of_birth.
  form text,                             -- "1".."6L".."6U"
  class_id uuid references classes(id) on delete set null,
  class_group text,                      -- denormalized name e.g. "4A"
  academic_year text,
  track track,
  house_id uuid references houses(id) on delete set null,
  avatar_url text,
  bio text,
  approved boolean not null default true,  -- toggled false for teachers/admins until verified
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile when a new auth user signs up (including anonymous guests).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  is_guest boolean := coalesce(new.is_anonymous, false);
  raw_role text := new.raw_user_meta_data->>'role';
  default_name text :=
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.email,
      case when is_guest then 'Guest Lion' else null end
    );
  grade_in int := nullif(new.raw_user_meta_data->>'grade', '')::int;
  form_in text := new.raw_user_meta_data->>'form';
  class_in text := nullif(new.raw_user_meta_data->>'class_group', '');
  grad_year int := nullif(new.raw_user_meta_data->>'graduating_year', '')::int;
begin
  insert into public.profiles (
    id, full_name, display_name, role, approved,
    grade, form, class_group, graduating_year
  )
  values (
    new.id,
    default_name,
    case when is_guest then 'Guest' else null end,
    coalesce(raw_role::user_role, 'student'),
    case
      when coalesce(raw_role, 'student') in ('teacher', 'admin') then false
      else true
    end,
    grade_in,
    coalesce(form_in, public.form_name(grade_in)),
    class_in,
    grad_year
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- Student ↔ Subjects
-------------------------------------------------------------------------------
create table if not exists student_subjects (
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  is_sba boolean not null default false,
  primary key (student_id, subject_id)
);

-------------------------------------------------------------------------------
-- Groups (house / form / class / subject / sba / club / sport / alumni)
-------------------------------------------------------------------------------
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  type group_type not null,
  name text not null,
  description text,
  cover_url text,
  is_private boolean not null default false,
  approved boolean not null default true,
  ref_id uuid,                           -- optional link to house/class/subject
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',   -- member | mod | leader
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-------------------------------------------------------------------------------
-- Posts & comments
-------------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Announcements (from prefects / admin / house captains)
-------------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null,                -- "school" | "house:<id>" | "form:<n>" | "class:<id>"
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Resources (past papers, notes)
-------------------------------------------------------------------------------
create table if not exists resources (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  uploader_id uuid references profiles(id) on delete set null,
  subject text not null,
  kind text not null,                    -- "past_paper" | "notes" | "video" | "link"
  title text not null,
  url text not null,
  storage_path text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- SBA projects
-------------------------------------------------------------------------------
create table if not exists sba_projects (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  title text not null,
  due_date date,
  status sba_status not null default 'not_started',
  percent_complete int not null default 0 check (percent_complete between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Clubs & sports
-------------------------------------------------------------------------------
create table if not exists clubs (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  description text,
  leader_id uuid references profiles(id) on delete set null,
  meeting_day text,
  meeting_time text,
  approved boolean not null default false
);

create table if not exists sports_teams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,                    -- "Manning Cup Senior"
  sport text not null,                   -- "football"
  coach_id uuid references profiles(id) on delete set null,
  season text                            -- "2026/2027"
);

-------------------------------------------------------------------------------
-- Mentors
-------------------------------------------------------------------------------
create table if not exists mentors (
  id uuid primary key references profiles(id) on delete cascade,
  full_name text not null,
  graduation_year int,
  industry text,
  bio text,
  avatar_url text,
  linkedin_url text,
  capacity int not null default 2,
  taken int not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Badges
-------------------------------------------------------------------------------
create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  icon text
);

create table if not exists user_badges (
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-------------------------------------------------------------------------------
-- Notifications
-------------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Reports / moderation
-------------------------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type text not null,             -- "post" | "comment" | "user" | "group"
  target_id uuid,
  reason text not null,
  details text,
  status report_status not null default 'open',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-------------------------------------------------------------------------------
-- Helpers
-------------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'teacher')
  );
$$;

-------------------------------------------------------------------------------
-- Row Level Security
-------------------------------------------------------------------------------
alter table profiles enable row level security;
alter table houses enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table student_subjects enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table announcements enable row level security;
alter table resources enable row level security;
alter table sba_projects enable row level security;
alter table clubs enable row level security;
alter table sports_teams enable row level security;
alter table mentors enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;

-- Profiles: anyone signed in can read; only owner (or admin) can update.
drop policy if exists "profiles select" on profiles;
create policy "profiles select" on profiles for select
  using (auth.uid() is not null);

drop policy if exists "profiles update self" on profiles;
create policy "profiles update self" on profiles for update
  using (auth.uid() = id or is_admin(auth.uid()))
  with check (auth.uid() = id or is_admin(auth.uid()));

-- Houses / classes / subjects: readable by all signed-in users; only admins write.
drop policy if exists "reference read" on houses;
create policy "reference read" on houses for select using (auth.uid() is not null);
drop policy if exists "reference write" on houses;
create policy "reference write" on houses for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

drop policy if exists "classes read" on classes;
create policy "classes read" on classes for select using (auth.uid() is not null);
drop policy if exists "classes write" on classes;
create policy "classes write" on classes for all
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

drop policy if exists "subjects read" on subjects;
create policy "subjects read" on subjects for select using (auth.uid() is not null);
drop policy if exists "subjects write" on subjects;
create policy "subjects write" on subjects for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Student subjects: each student manages their own.
drop policy if exists "student_subjects own" on student_subjects;
create policy "student_subjects own" on student_subjects for all
  using (auth.uid() = student_id or is_staff(auth.uid()))
  with check (auth.uid() = student_id or is_staff(auth.uid()));

-- Groups: readable when public or member; writable by staff and group leaders.
drop policy if exists "groups read" on groups;
create policy "groups read" on groups for select
  using (
    auth.uid() is not null
    and (
      approved
      and (not is_private or exists (
        select 1 from group_members gm where gm.group_id = id and gm.user_id = auth.uid()
      ))
    )
  );
drop policy if exists "groups write" on groups;
create policy "groups write" on groups for all
  using (is_staff(auth.uid()) or auth.uid() = created_by)
  with check (is_staff(auth.uid()) or auth.uid() = created_by);

drop policy if exists "group_members read" on group_members;
create policy "group_members read" on group_members for select using (auth.uid() is not null);
drop policy if exists "group_members self" on group_members;
create policy "group_members self" on group_members for all
  using (auth.uid() = user_id or is_staff(auth.uid()))
  with check (auth.uid() = user_id or is_staff(auth.uid()));

-- Posts & comments: visible to members of the group; author can edit/delete; staff override.
drop policy if exists "posts read" on posts;
create policy "posts read" on posts for select using (
  auth.uid() is not null and (
    group_id is null or exists (
      select 1 from group_members gm where gm.group_id = posts.group_id and gm.user_id = auth.uid()
    ) or is_staff(auth.uid())
  )
);
drop policy if exists "posts write" on posts;
create policy "posts write" on posts for insert
  with check (auth.uid() = author_id);
drop policy if exists "posts update" on posts;
create policy "posts update" on posts for update
  using (auth.uid() = author_id or is_staff(auth.uid()))
  with check (auth.uid() = author_id or is_staff(auth.uid()));
drop policy if exists "posts delete" on posts;
create policy "posts delete" on posts for delete
  using (auth.uid() = author_id or is_staff(auth.uid()));

drop policy if exists "comments read" on comments;
create policy "comments read" on comments for select using (auth.uid() is not null);
drop policy if exists "comments write" on comments;
create policy "comments write" on comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments update" on comments;
create policy "comments update" on comments for update
  using (auth.uid() = author_id or is_staff(auth.uid()))
  with check (auth.uid() = author_id or is_staff(auth.uid()));
drop policy if exists "comments delete" on comments;
create policy "comments delete" on comments for delete
  using (auth.uid() = author_id or is_staff(auth.uid()));

-- Announcements: readable by everyone signed in; only staff/prefects post.
drop policy if exists "announcements read" on announcements;
create policy "announcements read" on announcements for select using (auth.uid() is not null);
drop policy if exists "announcements write" on announcements;
create policy "announcements write" on announcements for all
  using (
    is_staff(auth.uid()) or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('prefect', 'house_captain', 'club_leader', 'coach')
    )
  )
  with check (
    is_staff(auth.uid()) or exists (
      select 1 from profiles
      where id = auth.uid() and role in ('prefect', 'house_captain', 'club_leader', 'coach')
    )
  );

-- Resources: readable by all signed in; teachers/admins can write.
drop policy if exists "resources read" on resources;
create policy "resources read" on resources for select using (auth.uid() is not null and approved);
drop policy if exists "resources write" on resources;
create policy "resources write" on resources for all
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- SBA projects: student owns their own; teachers can read/write for their students.
drop policy if exists "sba own" on sba_projects;
create policy "sba own" on sba_projects for all
  using (auth.uid() = student_id or is_staff(auth.uid()))
  with check (auth.uid() = student_id or is_staff(auth.uid()));

-- Clubs & sports: readable by all signed in; staff/admin manage.
drop policy if exists "clubs read" on clubs;
create policy "clubs read" on clubs for select using (auth.uid() is not null and approved);
drop policy if exists "clubs write" on clubs;
create policy "clubs write" on clubs for all
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

drop policy if exists "sports read" on sports_teams;
create policy "sports read" on sports_teams for select using (auth.uid() is not null);
drop policy if exists "sports write" on sports_teams;
create policy "sports write" on sports_teams for all
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- Mentors: anyone signed in can read approved mentors; only the mentor or admin writes.
drop policy if exists "mentors read" on mentors;
create policy "mentors read" on mentors for select
  using (auth.uid() is not null and (approved or auth.uid() = id or is_admin(auth.uid())));
drop policy if exists "mentors self" on mentors;
create policy "mentors self" on mentors for all
  using (auth.uid() = id or is_admin(auth.uid()))
  with check (auth.uid() = id or is_admin(auth.uid()));

-- Badges
drop policy if exists "badges read" on badges;
create policy "badges read" on badges for select using (true);
drop policy if exists "badges write" on badges;
create policy "badges write" on badges for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

drop policy if exists "user_badges read" on user_badges;
create policy "user_badges read" on user_badges for select using (auth.uid() is not null);
drop policy if exists "user_badges write" on user_badges;
create policy "user_badges write" on user_badges for all
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

-- Notifications: each user sees their own.
drop policy if exists "notifications own" on notifications;
create policy "notifications own" on notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reports: any signed-in user can file; only admins read/update.
drop policy if exists "reports insert" on reports;
create policy "reports insert" on reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports admin" on reports;
create policy "reports admin" on reports for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-------------------------------------------------------------------------------
-- Touch trigger for updated_at on profiles & sba_projects
-------------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists touch_profiles on profiles;
create trigger touch_profiles before update on profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_sba on sba_projects;
create trigger touch_sba before update on sba_projects
  for each row execute function public.touch_updated_at();

-------------------------------------------------------------------------------
-- Calabar grade / form / class structure + sports tree
-- (additive; re-runnable)
-------------------------------------------------------------------------------

-- Profile identity columns
alter table profiles
  add column if not exists grade int,
  add column if not exists graduating_year int,
  add column if not exists sport text,
  add column if not exists club text;

-- Group hierarchy (channels live under their parent class/sport)
alter table groups
  add column if not exists parent_id uuid references groups(id) on delete cascade,
  add column if not exists slug text;

create index if not exists groups_parent_idx on groups (parent_id);
create unique index if not exists groups_slug_uniq on groups (school_id, slug) where slug is not null;

-- Helper to compute form name from grade
create or replace function public.form_name(g int)
returns text language sql immutable as $$
  select case g
    when 7 then 'First Form'
    when 8 then 'Second Form'
    when 9 then 'Third Form'
    when 10 then 'Fourth Form'
    when 11 then 'Fifth Form'
    when 12 then 'Lower Sixth'
    when 13 then 'Upper Sixth'
    else null
  end;
$$;

-- Seed 40 main classes (Grades 7–11, streams 1–8) and their groups + channels.
do $$
declare
  school_uuid uuid := '00000000-0000-0000-0000-000000000001';
  g int;
  s int;
  class_name text;
  cls_id uuid;
  group_id uuid;
  channel_name text;
  channels text[] := array[
    'General Chat', 'Homework', 'Timetable', 'Announcements',
    'Memes', 'Sports', 'Attendance', 'Study Sessions',
    'Exam Prep', 'Class Media'
  ];
begin
  for g in 7..11 loop
    for s in 1..8 loop
      class_name := g || '-' || s;

      -- canonical class row
      insert into classes (school_id, name, form)
      values (school_uuid, class_name, public.form_name(g))
      on conflict do nothing
      returning id into cls_id;

      if cls_id is null then
        select id into cls_id from classes
         where school_id = school_uuid and name = class_name limit 1;
      end if;

      -- the social group for the class
      insert into groups (school_id, type, name, description, slug, ref_id, approved)
      values (
        school_uuid, 'class', class_name,
        public.form_name(g) || ' · ' || class_name,
        'class-' || class_name, cls_id, true
      )
      on conflict do nothing;

      select id into group_id from groups
       where school_id = school_uuid and slug = 'class-' || class_name limit 1;

      -- channels under the class group
      foreach channel_name in array channels loop
        insert into groups (school_id, type, name, slug, parent_id, approved)
        values (
          school_uuid, 'class', channel_name,
          'class-' || class_name || '-' ||
            lower(replace(channel_name, ' ', '-')),
          group_id, true
        )
        on conflict do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- Sixth-form streams (Lower & Upper). Each is a top-level "class" group.
insert into groups (school_id, type, name, description, slug, approved) values
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · Science', 'L6 Science stream', 'l6-science', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · Business', 'L6 Business stream', 'l6-business', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · Humanities', 'L6 Humanities stream', 'l6-humanities', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · Engineering', 'L6 Engineering stream', 'l6-engineering', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · CAPE Unit 1', 'CAPE Unit 1 cohort', 'l6-cape-unit-1', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · SAT Prep', 'SAT preparation', 'l6-sat-prep', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · Scholarships', 'Scholarship hunters', 'l6-scholarships', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Lower Sixth · University Prep', 'University preparation', 'l6-uni-prep', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · CAPE Unit 2', 'CAPE Unit 2 cohort', 'u6-cape-unit-2', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · Graduation', 'Class graduating soon', 'u6-graduation', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · University Applications', 'UCAS / Common App / regional', 'u6-uni-apps', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · Career Planning', 'Careers and internships', 'u6-careers', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · Entrepreneurship', 'Founders and side hustles', 'u6-entrepreneurship', true),
  ('00000000-0000-0000-0000-000000000001', 'class', 'Upper Sixth · Alumni Transition', 'Stepping into Old Boys life', 'u6-alumni-transition', true)
on conflict do nothing;

-- Sports hub + main sports
insert into groups (school_id, type, name, description, slug, approved) values
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Track & Field', 'Champs and beyond', 'sport-track-and-field', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Football', 'Manning Cup, daCosta Cup', 'sport-football', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Cricket', 'Cricket squad', 'sport-cricket', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Basketball', 'Basketball squad', 'sport-basketball', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Rugby', 'Rugby squad', 'sport-rugby', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Swimming', 'Aquatics', 'sport-swimming', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Table Tennis', 'Table tennis', 'sport-table-tennis', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Chess', 'Chess club', 'sport-chess', true),
  ('00000000-0000-0000-0000-000000000001', 'sport', 'Fitness Club', 'Strength and conditioning', 'sport-fitness', true)
on conflict do nothing;

-- Track & Field sub-teams (parent = the Track & Field hub group).
do $$
declare
  parent_uuid uuid;
  school_uuid uuid := '00000000-0000-0000-0000-000000000001';
  sub text;
  subs text[] := array[
    'Sprinters', 'Relay Teams', 'Hurdlers', 'Long Jump', 'High Jump',
    'Throwers', 'Middle Distance', 'Long Distance', 'Strength Training',
    'Coaches', 'Records', 'Champs Preparation'
  ];
begin
  select id into parent_uuid from groups
   where school_id = school_uuid and slug = 'sport-track-and-field' limit 1;
  if parent_uuid is null then return; end if;

  foreach sub in array subs loop
    insert into groups (school_id, type, name, slug, parent_id, approved)
    values (
      school_uuid, 'sport', sub,
      'tf-' || lower(replace(replace(sub, ' ', '-'), '&', 'and')),
      parent_uuid, true
    )
    on conflict do nothing;
  end loop;
end $$;

-------------------------------------------------------------------------------
-- Storage: resources bucket + access policies
-------------------------------------------------------------------------------

-- Public read bucket. RLS still controls who can write.
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Anyone signed in can read object metadata for the resources bucket.
drop policy if exists "resources storage read" on storage.objects;
create policy "resources storage read"
  on storage.objects for select
  using (bucket_id = 'resources' and auth.uid() is not null);

-- Staff (teachers/admins) can upload to the resources bucket.
drop policy if exists "resources storage staff write" on storage.objects;
create policy "resources storage staff write"
  on storage.objects for insert
  with check (
    bucket_id = 'resources'
    and public.is_staff(auth.uid())
  );

-- Staff can replace/delete their own (or any) uploads.
drop policy if exists "resources storage staff update" on storage.objects;
create policy "resources storage staff update"
  on storage.objects for update
  using (bucket_id = 'resources' and public.is_staff(auth.uid()))
  with check (bucket_id = 'resources' and public.is_staff(auth.uid()));

drop policy if exists "resources storage staff delete" on storage.objects;
create policy "resources storage staff delete"
  on storage.objects for delete
  using (bucket_id = 'resources' and public.is_staff(auth.uid()));


-------------------------------------------------------------------------------
-- Lion Tools: documents, spreadsheets, slide decks
-------------------------------------------------------------------------------

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'doc',     -- 'doc' | 'note'
  title text not null default 'Untitled',
  body text not null default '',
  subject text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_owner_idx on documents (owner_id, kind, updated_at desc);

create table if not exists spreadsheets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled',
  cells jsonb not null default '{}'::jsonb,
  rows int not null default 20,
  cols int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists spreadsheets_owner_idx on spreadsheets (owner_id, updated_at desc);

create table if not exists slide_decks (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled',
  slides jsonb not null default
    '[{"title":"Welcome","body":"Your first slide. Press Edit to change it."}]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists slide_decks_owner_idx on slide_decks (owner_id, updated_at desc);

-- Link SBA projects to artefacts (additive)
alter table sba_projects
  add column if not exists document_id uuid references documents(id) on delete set null,
  add column if not exists spreadsheet_id uuid references spreadsheets(id) on delete set null,
  add column if not exists slide_deck_id uuid references slide_decks(id) on delete set null;

-- Touch triggers
drop trigger if exists touch_documents on documents;
create trigger touch_documents before update on documents
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_spreadsheets on spreadsheets;
create trigger touch_spreadsheets before update on spreadsheets
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_slide_decks on slide_decks;
create trigger touch_slide_decks before update on slide_decks
  for each row execute function public.touch_updated_at();

-- RLS
alter table documents enable row level security;
alter table spreadsheets enable row level security;
alter table slide_decks enable row level security;

drop policy if exists "documents owner" on documents;
create policy "documents owner" on documents for all
  using (auth.uid() = owner_id or is_staff(auth.uid()) or is_public)
  with check (auth.uid() = owner_id or is_staff(auth.uid()));

drop policy if exists "spreadsheets owner" on spreadsheets;
create policy "spreadsheets owner" on spreadsheets for all
  using (auth.uid() = owner_id or is_staff(auth.uid()))
  with check (auth.uid() = owner_id or is_staff(auth.uid()));

drop policy if exists "slide_decks owner" on slide_decks;
create policy "slide_decks owner" on slide_decks for all
  using (auth.uid() = owner_id or is_staff(auth.uid()))
  with check (auth.uid() = owner_id or is_staff(auth.uid()));

-------------------------------------------------------------------------------
-- Tool comments (teacher review on docs / sheets / slides / sba)
-------------------------------------------------------------------------------

create table if not exists tool_comments (
  id uuid primary key default uuid_generate_v4(),
  target_kind text not null check (target_kind in ('doc', 'sheet', 'slides', 'sba')),
  target_id uuid not null,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tool_comments_target_idx
  on tool_comments (target_kind, target_id, created_at desc);

alter table tool_comments enable row level security;

-- Read: must have read access to the underlying artefact.
drop policy if exists "tool_comments read" on tool_comments;
create policy "tool_comments read" on tool_comments for select using (
  auth.uid() is not null and (
    is_staff(auth.uid())
    or (target_kind = 'doc' and exists (
         select 1 from documents d where d.id = target_id and d.owner_id = auth.uid()))
    or (target_kind = 'sheet' and exists (
         select 1 from spreadsheets s where s.id = target_id and s.owner_id = auth.uid()))
    or (target_kind = 'slides' and exists (
         select 1 from slide_decks sd where sd.id = target_id and sd.owner_id = auth.uid()))
    or (target_kind = 'sba' and exists (
         select 1 from sba_projects p where p.id = target_id and p.student_id = auth.uid()))
  )
);

-- Insert: author must be themselves; must have read access (same rule).
drop policy if exists "tool_comments insert" on tool_comments;
create policy "tool_comments insert" on tool_comments for insert with check (
  author_id = auth.uid() and (
    is_staff(auth.uid())
    or (target_kind = 'doc' and exists (
         select 1 from documents d where d.id = target_id and d.owner_id = auth.uid()))
    or (target_kind = 'sheet' and exists (
         select 1 from spreadsheets s where s.id = target_id and s.owner_id = auth.uid()))
    or (target_kind = 'slides' and exists (
         select 1 from slide_decks sd where sd.id = target_id and sd.owner_id = auth.uid()))
    or (target_kind = 'sba' and exists (
         select 1 from sba_projects p where p.id = target_id and p.student_id = auth.uid()))
  )
);

-- Update: author can edit own; staff can resolve any.
drop policy if exists "tool_comments update" on tool_comments;
create policy "tool_comments update" on tool_comments for update
  using (author_id = auth.uid() or is_staff(auth.uid()))
  with check (author_id = auth.uid() or is_staff(auth.uid()));

-- Delete: author or staff.
drop policy if exists "tool_comments delete" on tool_comments;
create policy "tool_comments delete" on tool_comments for delete
  using (author_id = auth.uid() or is_staff(auth.uid()));

-------------------------------------------------------------------------------
-- Notifications: ping artefact owner when someone else comments
-------------------------------------------------------------------------------

create or replace function public.notify_tool_comment()
returns trigger language plpgsql security definer as $$
declare
  owner uuid;
  artefact_title text;
  href text;
  author_name text;
begin
  -- Find the owner + title for the target.
  if new.target_kind = 'doc' then
    select owner_id, title into owner, artefact_title
      from documents where id = new.target_id;
    href := '/tools/docs/' || new.target_id;
  elsif new.target_kind = 'sheet' then
    select owner_id, title into owner, artefact_title
      from spreadsheets where id = new.target_id;
    href := '/tools/sheets/' || new.target_id;
  elsif new.target_kind = 'slides' then
    select owner_id, title into owner, artefact_title
      from slide_decks where id = new.target_id;
    href := '/tools/slides/' || new.target_id;
  elsif new.target_kind = 'sba' then
    select student_id, title into owner, artefact_title
      from sba_projects where id = new.target_id;
    href := '/tools/sba/' || new.target_id;
  end if;

  -- Don't notify the author about their own comment.
  if owner is null or owner = new.author_id then return new; end if;

  select coalesce(display_name, full_name, 'Someone')
    into author_name
    from profiles where id = new.author_id;

  insert into notifications (user_id, kind, payload)
  values (
    owner,
    'tool_comment',
    jsonb_build_object(
      'title', coalesce(author_name, 'Someone') || ' commented on ' || coalesce(artefact_title, 'your work'),
      'body', left(new.body, 200),
      'href', href
    )
  );

  return new;
end $$;

drop trigger if exists tool_comment_notify on tool_comments;
create trigger tool_comment_notify
  after insert on tool_comments
  for each row execute function public.notify_tool_comment();

-------------------------------------------------------------------------------
-- SBA project files (research folder)
-------------------------------------------------------------------------------

create table if not exists sba_files (
  id uuid primary key default uuid_generate_v4(),
  sba_id uuid not null references sba_projects(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  storage_path text not null,
  url text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index if not exists sba_files_sba_idx on sba_files (sba_id, created_at desc);

alter table sba_files enable row level security;

drop policy if exists "sba_files read" on sba_files;
create policy "sba_files read" on sba_files for select using (
  exists (
    select 1 from sba_projects p
    where p.id = sba_id and (p.student_id = auth.uid() or is_staff(auth.uid()))
  )
);

drop policy if exists "sba_files write" on sba_files;
create policy "sba_files write" on sba_files for insert with check (
  owner_id = auth.uid() and exists (
    select 1 from sba_projects p
    where p.id = sba_id and p.student_id = auth.uid()
  )
);

drop policy if exists "sba_files delete" on sba_files;
create policy "sba_files delete" on sba_files for delete using (
  owner_id = auth.uid() or is_staff(auth.uid())
);

-- Storage bucket for SBA files (private)
insert into storage.buckets (id, name, public)
values ('sba-files', 'sba-files', false)
on conflict (id) do nothing;

drop policy if exists "sba-files storage read" on storage.objects;
create policy "sba-files storage read"
  on storage.objects for select
  using (
    bucket_id = 'sba-files'
    and (
      is_staff(auth.uid())
      or exists (
        select 1 from sba_files f
        join sba_projects p on p.id = f.sba_id
        where f.storage_path = name and p.student_id = auth.uid()
      )
    )
  );

drop policy if exists "sba-files storage write" on storage.objects;
create policy "sba-files storage write"
  on storage.objects for insert
  with check (
    bucket_id = 'sba-files'
    and auth.uid() is not null
  );

drop policy if exists "sba-files storage delete" on storage.objects;
create policy "sba-files storage delete"
  on storage.objects for delete
  using (
    bucket_id = 'sba-files'
    and (
      is_staff(auth.uid())
      or exists (
        select 1 from sba_files f
        join sba_projects p on p.id = f.sba_id
        where f.storage_path = name and p.student_id = auth.uid()
      )
    )
  );

-------------------------------------------------------------------------------
-- Lion Docs: linked artefacts, submission state, citations, versions
-------------------------------------------------------------------------------

alter table documents
  add column if not exists linked_spreadsheet_id uuid references spreadsheets(id) on delete set null,
  add column if not exists linked_slide_deck_id uuid references slide_decks(id) on delete set null,
  add column if not exists status text not null default 'draft',
  add column if not exists submitted_at timestamptz,
  add column if not exists citations jsonb not null default '[]'::jsonb;

do $$ begin
  alter table documents
    add constraint documents_status_check check (status in ('draft', 'submitted', 'reviewed'));
exception when duplicate_object then null; end $$;

create table if not exists document_versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  title text not null,
  body text not null,
  saved_by uuid references profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists document_versions_doc_idx
  on document_versions (document_id, created_at desc);

alter table document_versions enable row level security;

drop policy if exists "document_versions read" on document_versions;
create policy "document_versions read" on document_versions for select using (
  exists (
    select 1 from documents d
    where d.id = document_id
      and (d.owner_id = auth.uid() or is_staff(auth.uid()))
  )
);

drop policy if exists "document_versions write" on document_versions;
create policy "document_versions write" on document_versions for insert with check (
  exists (
    select 1 from documents d
    where d.id = document_id
      and (d.owner_id = auth.uid() or is_staff(auth.uid()))
  )
);

drop policy if exists "document_versions delete" on document_versions;
create policy "document_versions delete" on document_versions for delete using (
  exists (
    select 1 from documents d
    where d.id = document_id and d.owner_id = auth.uid()
  )
);

-- Notify staff (form teachers / admins of the school) when a doc is submitted.
create or replace function public.notify_doc_submission()
returns trigger language plpgsql security definer as $$
declare
  student_name text;
begin
  if new.status <> 'submitted' or coalesce(old.status, 'draft') = 'submitted' then
    return new;
  end if;
  select coalesce(display_name, full_name, 'A student')
    into student_name from profiles where id = new.owner_id;

  insert into notifications (user_id, kind, payload)
  select id, 'doc_submission',
    jsonb_build_object(
      'title', coalesce(student_name, 'Student') || ' submitted "' || new.title || '" for review',
      'href', '/tools/docs/' || new.id
    )
  from profiles
  where role in ('teacher', 'admin') and id <> new.owner_id;
  return new;
end $$;

drop trigger if exists doc_submission_notify on documents;
create trigger doc_submission_notify
  after update of status on documents
  for each row execute function public.notify_doc_submission();

-- Guests (anonymous users) shouldn't trigger a school-wide submission ping.
create or replace function public.notify_doc_submission()
returns trigger language plpgsql security definer as $$
declare
  student_name text;
  is_guest boolean;
begin
  if new.status <> 'submitted' or coalesce(old.status, 'draft') = 'submitted' then
    return new;
  end if;

  select coalesce(au.is_anonymous, false), coalesce(p.display_name, p.full_name, 'A student')
    into is_guest, student_name
    from auth.users au
    join profiles p on p.id = au.id
   where au.id = new.owner_id;

  if coalesce(is_guest, false) then
    -- Notify only the author themselves that guest submissions don't reach teachers.
    insert into notifications (user_id, kind, payload)
    values (
      new.owner_id,
      'doc_submission_guest',
      jsonb_build_object(
        'title', 'Guest submissions don''t reach a teacher',
        'body', 'Claim your account with an email to send "' || new.title || '" for review.',
        'href', '/tools/docs/' || new.id
      )
    );
    return new;
  end if;

  insert into notifications (user_id, kind, payload)
  select id, 'doc_submission',
    jsonb_build_object(
      'title', coalesce(student_name, 'Student') || ' submitted "' || new.title || '" for review',
      'href', '/tools/docs/' || new.id
    )
  from profiles
  where role in ('teacher', 'admin') and id <> new.owner_id;
  return new;
end $$;

-------------------------------------------------------------------------------
-- Lion Docs: collaboration via document_shares
-------------------------------------------------------------------------------

create table if not exists document_shares (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  shared_with_id uuid not null references profiles(id) on delete cascade,
  can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  unique (document_id, shared_with_id)
);
create index if not exists document_shares_user_idx
  on document_shares (shared_with_id, created_at desc);

alter table document_shares enable row level security;

drop policy if exists "document_shares owner manage" on document_shares;
create policy "document_shares owner manage" on document_shares for all
  using (exists (
    select 1 from documents d where d.id = document_id and d.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from documents d where d.id = document_id and d.owner_id = auth.uid()
  ));

drop policy if exists "document_shares read self" on document_shares;
create policy "document_shares read self" on document_shares for select
  using (shared_with_id = auth.uid() or is_staff(auth.uid()));

-- Replace the single documents policy with granular ones that respect shares.
drop policy if exists "documents owner" on documents;
drop policy if exists "documents select" on documents;
drop policy if exists "documents insert" on documents;
drop policy if exists "documents update" on documents;
drop policy if exists "documents delete" on documents;

create policy "documents select" on documents for select using (
  auth.uid() = owner_id
  or is_staff(auth.uid())
  or is_public
  or exists (
    select 1 from document_shares ds
    where ds.document_id = id and ds.shared_with_id = auth.uid()
  )
);

create policy "documents insert" on documents for insert
  with check (auth.uid() = owner_id);

create policy "documents update" on documents for update
  using (
    auth.uid() = owner_id
    or is_staff(auth.uid())
    or exists (
      select 1 from document_shares ds
      where ds.document_id = id and ds.shared_with_id = auth.uid() and ds.can_edit
    )
  )
  with check (
    auth.uid() = owner_id
    or is_staff(auth.uid())
    or exists (
      select 1 from document_shares ds
      where ds.document_id = id and ds.shared_with_id = auth.uid() and ds.can_edit
    )
  );

create policy "documents delete" on documents for delete
  using (auth.uid() = owner_id or is_staff(auth.uid()));

-- Notify the recipient when they're given access to a document.
create or replace function public.notify_document_share()
returns trigger language plpgsql security definer as $$
declare
  doc_title text;
  owner_name text;
begin
  select d.title, coalesce(p.display_name, p.full_name, 'A classmate')
    into doc_title, owner_name
    from documents d
    join profiles p on p.id = d.owner_id
   where d.id = new.document_id;

  insert into notifications (user_id, kind, payload)
  values (
    new.shared_with_id,
    'document_share',
    jsonb_build_object(
      'title', coalesce(owner_name, 'Someone') || ' shared "' || coalesce(doc_title, 'a document') || '" with you',
      'body', case when new.can_edit then 'You can edit and comment.' else 'You can read and comment.' end,
      'href', '/tools/docs/' || new.document_id
    )
  );
  return new;
end $$;

drop trigger if exists document_share_notify on document_shares;
create trigger document_share_notify
  after insert on document_shares
  for each row execute function public.notify_document_share();

-------------------------------------------------------------------------------
-- Break RLS recursion between documents and document_shares
-- SECURITY DEFINER functions bypass RLS for the cross-table lookup.
-------------------------------------------------------------------------------

create or replace function public.is_document_owner(doc_id uuid, uid uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from documents where id = doc_id and owner_id = uid);
$$;

create or replace function public.is_document_shared_with(doc_id uuid, uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from document_shares
    where document_id = doc_id and shared_with_id = uid
  );
$$;

create or replace function public.user_can_edit_document(doc_id uuid, uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from document_shares
    where document_id = doc_id and shared_with_id = uid and can_edit
  );
$$;

-- Replace recursive policies on documents.
drop policy if exists "documents select" on documents;
create policy "documents select" on documents for select using (
  auth.uid() = owner_id
  or is_staff(auth.uid())
  or is_public
  or public.is_document_shared_with(id, auth.uid())
);

drop policy if exists "documents update" on documents;
create policy "documents update" on documents for update
  using (
    auth.uid() = owner_id
    or is_staff(auth.uid())
    or public.user_can_edit_document(id, auth.uid())
  )
  with check (
    auth.uid() = owner_id
    or is_staff(auth.uid())
    or public.user_can_edit_document(id, auth.uid())
  );

-- Replace recursive policy on document_shares.
drop policy if exists "document_shares owner manage" on document_shares;
create policy "document_shares owner manage" on document_shares for all
  using (public.is_document_owner(document_id, auth.uid()))
  with check (public.is_document_owner(document_id, auth.uid()));

-- Tool comments referenced documents directly — convert to the helper too
-- so a sharer with read access can also see comments on the doc.
drop policy if exists "tool_comments read" on tool_comments;
create policy "tool_comments read" on tool_comments for select using (
  auth.uid() is not null and (
    is_staff(auth.uid())
    or (target_kind = 'doc' and (
      public.is_document_owner(target_id, auth.uid())
      or public.is_document_shared_with(target_id, auth.uid())
    ))
    or (target_kind = 'sheet' and exists (
         select 1 from spreadsheets s where s.id = target_id and s.owner_id = auth.uid()))
    or (target_kind = 'slides' and exists (
         select 1 from slide_decks sd where sd.id = target_id and sd.owner_id = auth.uid()))
    or (target_kind = 'sba' and exists (
         select 1 from sba_projects p where p.id = target_id and p.student_id = auth.uid()))
  )
);

drop policy if exists "tool_comments insert" on tool_comments;
create policy "tool_comments insert" on tool_comments for insert with check (
  author_id = auth.uid() and (
    is_staff(auth.uid())
    or (target_kind = 'doc' and (
      public.is_document_owner(target_id, auth.uid())
      or public.is_document_shared_with(target_id, auth.uid())
    ))
    or (target_kind = 'sheet' and exists (
         select 1 from spreadsheets s where s.id = target_id and s.owner_id = auth.uid()))
    or (target_kind = 'slides' and exists (
         select 1 from slide_decks sd where sd.id = target_id and sd.owner_id = auth.uid()))
    or (target_kind = 'sba' and exists (
         select 1 from sba_projects p where p.id = target_id and p.student_id = auth.uid()))
  )
);

-- document_versions referenced documents via subquery — same fix.
drop policy if exists "document_versions read" on document_versions;
create policy "document_versions read" on document_versions for select using (
  public.is_document_owner(document_id, auth.uid()) or is_staff(auth.uid())
);

drop policy if exists "document_versions write" on document_versions;
create policy "document_versions write" on document_versions for insert with check (
  public.is_document_owner(document_id, auth.uid()) or is_staff(auth.uid())
);

drop policy if exists "document_versions delete" on document_versions;
create policy "document_versions delete" on document_versions for delete using (
  public.is_document_owner(document_id, auth.uid())
);

-------------------------------------------------------------------------------
-- Allow users to upsert their own profile (self-heal for accounts that
-- pre-date the handle_new_user trigger).
-------------------------------------------------------------------------------
drop policy if exists "profiles insert self" on profiles;
create policy "profiles insert self" on profiles for insert
  with check (auth.uid() = id);

-------------------------------------------------------------------------------
-- One-time backfill: ensure every auth.users row has a matching profile.
-- Safe to re-run.
-------------------------------------------------------------------------------
insert into public.profiles (id, full_name, display_name, role, approved)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.email,
    case when coalesce(u.is_anonymous, false) then 'Guest Lion' else null end,
    'Calabar Lion'
  ),
  case when coalesce(u.is_anonymous, false) then 'Guest' else null end,
  coalesce((u.raw_user_meta_data->>'role')::user_role, 'student'),
  case
    when coalesce(u.raw_user_meta_data->>'role', 'student') in ('teacher', 'admin') then false
    else true
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-------------------------------------------------------------------------------
-- Auto-membership: every student is a member of their class group
-------------------------------------------------------------------------------

create or replace function public.sync_student_class_membership()
returns trigger language plpgsql security definer as $$
declare
  school_uuid uuid := '00000000-0000-0000-0000-000000000001';
  target_group_id uuid;
begin
  -- Remove from the previous class group when class_group changes
  if tg_op = 'UPDATE' and coalesce(old.class_group, '') <> coalesce(new.class_group, '') then
    delete from group_members gm
    using groups g
    where gm.user_id = new.id
      and gm.group_id = g.id
      and g.school_id = school_uuid
      and g.type = 'class'
      and g.parent_id is null
      and g.slug = 'class-' || coalesce(old.class_group, '');
  end if;

  if coalesce(new.class_group, '') = '' then
    return new;
  end if;

  select id into target_group_id
    from groups
   where school_id = school_uuid
     and type = 'class'
     and parent_id is null
     and slug = 'class-' || new.class_group
   limit 1;

  if target_group_id is not null then
    insert into group_members (group_id, user_id, role)
    values (target_group_id, new.id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists profiles_class_membership_sync on profiles;
create trigger profiles_class_membership_sync
  after insert or update of class_group on profiles
  for each row execute function public.sync_student_class_membership();

-- One-time backfill: enrol every student in their class group based on current class_group
insert into group_members (group_id, user_id, role)
select g.id, p.id, 'member'
  from profiles p
  join groups g
    on g.school_id = '00000000-0000-0000-0000-000000000001'
   and g.type = 'class'
   and g.parent_id is null
   and g.slug = 'class-' || p.class_group
 where p.class_group is not null
   and p.class_group <> ''
on conflict (group_id, user_id) do nothing;

-------------------------------------------------------------------------------
-- Admin hierarchy: super_admin / senior_admin / division assignment
-------------------------------------------------------------------------------

-- Postgres enums can be extended but only outside a transaction.
-- Wrap each addition in a guard so re-running is safe.
do $$ begin
  alter type user_role add value if not exists 'senior_admin';
exception when others then null; end $$;
do $$ begin
  alter type user_role add value if not exists 'super_admin';
exception when others then null; end $$;

alter table profiles
  add column if not exists admin_division text;
-- expected values: academic | student | sports | moderation | lion_tools | media

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'super_admin', 'senior_admin')
  );
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid
      and role in ('admin', 'super_admin', 'senior_admin', 'teacher')
  );
$$;

-------------------------------------------------------------------------------
-- Fix: cast role to text in is_admin/is_staff so the same script can both
-- ADD VALUE and reference it. Postgres forbids referencing a fresh enum value
-- in the same transaction, but text comparison sidesteps that check.
-------------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid
      and role::text in ('admin', 'super_admin', 'senior_admin')
  );
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid and role::text in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = uid
      and role::text in ('admin', 'super_admin', 'senior_admin', 'teacher')
  );
$$;
