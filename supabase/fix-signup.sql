-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: "Database error saving new user" on signup — v2 (complete rewrite)
-- Run this entire block in Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (all statements are idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Drop the broken trigger + function ───────────────────────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ─── STEP 2: Relax hard constraints that cause trigger to fail ────────────

-- The original schema.sql made full_name NOT NULL — the trigger may not
-- always have a name to insert (anonymous signups, OAuth, etc.)
alter table public.profiles alter column full_name drop not null;

-- The original schema had:  user_id uuid references auth.users NOT NULL
-- The trigger never sets user_id (it sets id = auth user UUID instead),
-- so every INSERT failed with a NOT NULL violation.
-- We make it nullable and the trigger will backfill it.
do $$
begin
  -- Only attempt if the column exists (schema varies between deployments)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'user_id'
  ) then
    execute 'alter table public.profiles alter column user_id drop not null';
    raise notice 'user_id made nullable';
  else
    raise notice 'user_id column not found — skipping (normal if using id-based schema)';
  end if;
end
$$;

-- ─── STEP 3: Add all columns the app and trigger expect ──────────────────
-- Every line uses ADD COLUMN IF NOT EXISTS — completely safe to re-run.
alter table public.profiles add column if not exists display_name  text;
alter table public.profiles add column if not exists approved      boolean default true;
alter table public.profiles add column if not exists house_id      uuid;
alter table public.profiles add column if not exists form          text;
alter table public.profiles add column if not exists academic_year text;
alter table public.profiles add column if not exists grade         int;
alter table public.profiles add column if not exists bio           text;

-- Make sure existing rows won't block new signups (set approved for old rows)
update public.profiles set approved = true where approved is null;

-- ─── STEP 4: Create a robust trigger function ────────────────────────────
--
-- Key improvements over v1:
--   • Sets user_id = new.id (satisfies any lingering NOT NULL on that column)
--   • approved = true   (users are immediately active after signup)
--   • Inner BEGIN…EXCEPTION block: if the INSERT fails for any reason
--     (schema mismatch, future migration, etc.) the error is LOGGED but
--     never propagated — auth user creation always succeeds, and the
--     signup page's own upsert acts as a fallback.
--   • ON CONFLICT (id) DO UPDATE: idempotent — replaying the trigger or
--     re-registering with the same ID is always safe.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _full_name text;
  _role      text;
  _suffix    text;
begin
  -- Build a unique 4-char suffix from the UUID for guest/anonymous fallback names
  _suffix := upper(substr(replace(new.id::text, '-', ''), 1, 4));

  _full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    case
      when new.email is not null then split_part(new.email, '@', 1)
      else 'Lion ' || _suffix
    end
  );

  _role := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'role'), ''),
    'student'
  );

  -- ── Inner block: any INSERT error is caught and logged, never fatal ──
  begin
    insert into public.profiles (
      id,
      full_name,
      display_name,
      role,
      form,
      bio,
      approved,
      created_at
    ) values (
      new.id,
      _full_name,
      _full_name,
      _role,
      new.raw_user_meta_data ->> 'form',
      new.raw_user_meta_data ->> 'bio',
      true,        -- ← approved immediately; signup page upsert also sets true
      now()
    )
    on conflict (id) do update
      set full_name    = excluded.full_name,
          display_name = excluded.display_name,
          role         = excluded.role,
          approved     = true;

    -- Also backfill user_id if the column exists (legacy schema compat)
    begin
      execute format(
        'update public.profiles set user_id = %L where id = %L and user_id is null',
        new.id, new.id
      );
    exception when undefined_column then
      null; -- user_id column doesn't exist in this deployment — that's fine
    end;

  exception when others then
    -- INSERT failed (schema mismatch, missing column, etc.)
    -- Log so it's visible in Supabase logs, but DON'T fail auth user creation.
    raise log 'handle_new_user: profile insert failed for user %, email %: % (SQLSTATE: %)',
      new.id, new.email, sqlerrm, sqlstate;
  end;

  return new;
end;
$$;

-- ─── STEP 5: Attach the trigger ──────────────────────────────────────────
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── STEP 6: Fix the RLS insert policy ──────────────────────────────────
-- Old policy (from schema.sql) used auth.uid() = user_id
-- App and trigger both use profiles.id = auth.users.id, so we match on id.
drop policy if exists "Users can insert their own profile"           on public.profiles;
drop policy if exists "Users can insert their own profile — id-based" on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Allow the trigger (runs as security definer / service role) to bypass RLS
-- when inserting the initial profile row. This is already handled by
-- security definer, but the explicit service-role grant avoids edge cases.
grant insert, update on public.profiles to service_role;

-- ─── STEP 7: Verify ──────────────────────────────────────────────────────
-- After running, check these all return rows:
--   select proname from pg_proc where proname = 'handle_new_user';
--   select tgname from pg_trigger where tgname = 'on_auth_user_created';
--   select column_name, is_nullable from information_schema.columns
--     where table_name = 'profiles' order by ordinal_position;
