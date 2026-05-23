-- Calabar Lions MVP Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Schools
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parish text not null,
  type text not null default 'secondary',
  logo_url text,
  created_at timestamptz default now()
);

-- Academic Years
create table academic_years (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean default false
);

-- Subjects
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  level text not null check (level in ('CSEC', 'CAPE', 'PEP', 'Other')),
  code text
);

-- Profiles
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null unique,
  full_name text not null,
  username text not null unique,
  avatar_url text,
  role text not null default 'student' check (role in ('student','teacher','school_admin','parent','alumni','group_admin')),
  school_id uuid references schools(id),
  grade text,
  academic_year text,
  bio text,
  house text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- Student Subjects
create table student_subjects (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  academic_year text,
  created_at timestamptz default now(),
  unique(student_id, subject_id)
);

-- Groups
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  type text not null check (type in ('subject','school','sba','club','house','general')),
  school_id uuid references schools(id),
  subject_id uuid references subjects(id),
  cover_url text,
  member_count int default 0,
  created_by uuid references profiles(id),
  is_private boolean default false,
  created_at timestamptz default now()
);

-- Group Members
create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('member','admin','moderator')),
  joined_at timestamptz default now(),
  unique(group_id, profile_id)
);

-- Posts
create table posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  content text not null,
  image_url text,
  likes_count int default 0,
  comments_count int default 0,
  saves_count int default 0,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- Comments
create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  likes_count int default 0,
  created_at timestamptz default now()
);

-- Post Likes
create table post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, profile_id)
);

-- Post Saves
create table post_saves (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, profile_id)
);

-- Resources
create table resources (
  id uuid primary key default uuid_generate_v4(),
  uploader_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text not null,
  subject_id uuid references subjects(id),
  level text,
  downloads int default 0,
  created_at timestamptz default now()
);

-- SBA Projects
create table sba_projects (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references profiles(id) on delete cascade,
  subject_id uuid references subjects(id),
  title text not null,
  description text,
  progress int default 0 check (progress between 0 and 100),
  status text default 'not_started' check (status in ('not_started','in_progress','submitted','graded')),
  due_date date,
  grade text,
  created_at timestamptz default now()
);

-- Badges
create table badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  icon text not null,
  color text not null default '#16a34a'
);

-- User Badges
create table user_badges (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique(profile_id, badge_id)
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  type text not null,
  message text not null,
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- Reports
create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','profile','group')),
  target_id uuid not null,
  reason text not null,
  status text default 'pending' check (status in ('pending','reviewed','resolved','dismissed')),
  created_at timestamptz default now()
);

-- Seed subjects
insert into subjects (name, level, code) values
('Mathematics', 'CSEC', 'MAT01'),
('English A', 'CSEC', 'ENG01'),
('English B', 'CSEC', 'ENG02'),
('Biology', 'CSEC', 'BIO01'),
('Chemistry', 'CSEC', 'CHE01'),
('Physics', 'CSEC', 'PHY01'),
('History', 'CSEC', 'HIS01'),
('Geography', 'CSEC', 'GEO01'),
('Information Technology', 'CSEC', 'IT01'),
('Social Studies', 'CSEC', 'SS01'),
('Spanish', 'CSEC', 'SPA01'),
('French', 'CSEC', 'FRE01'),
('Agricultural Science', 'CSEC', 'AGS01'),
('Principles of Accounts', 'CSEC', 'POA01'),
('Principles of Business', 'CSEC', 'POB01'),
('Pure Mathematics', 'CAPE', 'CPMAT'),
('Biology', 'CAPE', 'CPBIO'),
('Chemistry', 'CAPE', 'CPCHE'),
('Physics', 'CAPE', 'CPPHY'),
('Communication Studies', 'CAPE', 'CPCS'),
('Language Arts', 'PEP', 'PEPLA'),
('Mathematics', 'PEP', 'PEPMAT');

-- Seed badges
insert into badges (name, description, icon, color) values
('First Post', 'Made your first post on the Lions Den', '🦁', '#16a34a'),
('Study Champ', 'Completed 5 SBA milestones', '📚', '#eab308'),
('Group Leader', 'Created or admin of a group', '👑', '#7c3aed'),
('Resource Hero', 'Uploaded 3+ study resources', '📎', '#0891b2'),
('Lion Heart', 'Active member for 30 days', '❤️', '#dc2626');

-- RLS Policies
alter table profiles enable row level security;
alter table schools enable row level security;
alter table subjects enable row level security;
alter table student_subjects enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table post_likes enable row level security;
alter table post_saves enable row level security;
alter table resources enable row level security;
alter table sba_projects enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;

-- Profiles: viewable by all, editable by owner
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = user_id);

-- Schools: viewable by all
create policy "Schools are viewable by everyone" on schools for select using (true);

-- Subjects: viewable by all
create policy "Subjects are viewable by everyone" on subjects for select using (true);

-- Groups: public groups viewable by all
create policy "Public groups are viewable by everyone" on groups for select using (not is_private or exists (
  select 1 from group_members where group_id = id and profile_id = (select id from profiles where user_id = auth.uid())
));
create policy "Authenticated users can create groups" on groups for insert with check (auth.role() = 'authenticated');

-- Posts: viewable by all
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Authenticated users can create posts" on posts for insert with check (auth.role() = 'authenticated');
create policy "Authors can update their posts" on posts for update using (author_id = (select id from profiles where user_id = auth.uid()));
create policy "Authors can delete their posts" on posts for delete using (author_id = (select id from profiles where user_id = auth.uid()));

-- Comments
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Authenticated users can create comments" on comments for insert with check (auth.role() = 'authenticated');

-- Resources: viewable by all
create policy "Resources are viewable by everyone" on resources for select using (true);
create policy "Authenticated users can upload resources" on resources for insert with check (auth.role() = 'authenticated');

-- SBA projects: private to student
create policy "Students can view their own SBA" on sba_projects for select using (student_id = (select id from profiles where user_id = auth.uid()));
create policy "Students can manage their own SBA" on sba_projects for all using (student_id = (select id from profiles where user_id = auth.uid()));

-- Notifications: private to user
create policy "Users can view their own notifications" on notifications for select using (user_id = auth.uid());
create policy "Users can update their own notifications" on notifications for update using (user_id = auth.uid());

-- Badges: viewable by all
create policy "Badges are viewable by everyone" on badges for select using (true);
create policy "User badges are viewable by everyone" on user_badges for select using (true);
