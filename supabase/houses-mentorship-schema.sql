-- Houses table
create table if not exists houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#16a34a',
  motto text,
  description text,
  member_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Insert the 4 Calabar houses
insert into houses (name, color, motto, description) values
  ('Manning', '#1d4ed8', 'Strength and Honour', 'Manning House — home of champions'),
  ('Dacosta', '#dc2626', 'Courage and Pride', 'Dacosta House — fierce and fearless'),
  ('Lowe', '#ca8a04', 'Wisdom and Excellence', 'Lowe House — bright minds prevail'),
  ('Ashenheim', '#16a34a', 'Unity and Loyalty', 'Ashenheim House — together we stand')
on conflict do nothing;

-- Mentors table
create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  graduation_year int,
  industry text,
  company text,
  bio text,
  capacity int not null default 3,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Classes table
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  form text,
  school_id uuid,
  group_id uuid references groups(id),
  created_at timestamptz not null default now()
);

-- Add house_id to profiles if not exists
alter table profiles add column if not exists house_id uuid references houses(id);

-- RLS
alter table houses enable row level security;
create policy "Anyone can read houses" on houses for select using (true);

alter table mentors enable row level security;
create policy "Anyone can read mentors" on mentors for select using (true);
create policy "Users can insert own mentor record" on mentors for insert with check (auth.uid() = profile_id);

alter table classes enable row level security;
create policy "Anyone can read classes" on classes for select using (true);

-- Update member_count on group_members changes
create or replace function update_group_member_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update groups set member_count = member_count + 1 where id = NEW.group_id;
  elsif TG_OP = 'DELETE' then
    update groups set member_count = greatest(0, member_count - 1) where id = OLD.group_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_group_member_count on group_members;
create trigger trg_group_member_count
after insert or delete on group_members
for each row execute function update_group_member_count();
