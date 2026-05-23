-- ── Domino Game Schema ──────────────────────────────────────────────────────────
-- Run this file in Supabase SQL editor to set up the game schema.

-- Game rooms (lobbies)
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_players INT DEFAULT 4,
  current_players INT DEFAULT 0,
  points_to_win INT DEFAULT 100,
  max_rounds INT DEFAULT 10,
  status TEXT DEFAULT 'waiting',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to game_rooms (safe to run multiple times)
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'draw'; -- draw, teams, french, nine-nine
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS host_name TEXT;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS spectator_count INT DEFAULT 0;

-- Game sessions (one active game per room)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE UNIQUE,
  round_number INT DEFAULT 1,
  max_rounds INT DEFAULT 10,
  current_turn UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  board JSONB DEFAULT '[]',
  boneyard JSONB DEFAULT '[]',
  left_end INT,
  right_end INT,
  scores JSONB DEFAULT '{}',
  consecutive_passes INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Game players (with full hand stored server-side)
CREATE TABLE IF NOT EXISTS game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  seat INT NOT NULL,
  hand JSONB DEFAULT '[]',
  score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, profile_id)
);

-- Game chat
CREATE TABLE IF NOT EXISTS game_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Match history
CREATE TABLE IF NOT EXISTS match_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id),
  winner_id UUID REFERENCES profiles(id),
  winner_name TEXT,
  scores JSONB,
  game_mode TEXT,
  rounds_played INT,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table reactions (floating emoji reactions)
CREATE TABLE IF NOT EXISTS table_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some rooms
INSERT INTO game_rooms (name, points_to_win, max_rounds, game_mode) VALUES
  ('Lions Den', 100, 10, 'draw'),
  ('Pride Table', 50, 10, 'draw'),
  ('King''s Court', 100, 10, 'teams'),
  ('Roar Room', 200, 10, 'nine-nine'),
  ('Young Lions', 50, 10, 'draw')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_reactions ENABLE ROW LEVEL SECURITY;

-- Policies (safe to recreate)
DO $$ BEGIN
  CREATE POLICY "game_rooms_read" ON game_rooms FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_rooms_insert" ON game_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_rooms_update" ON game_rooms FOR UPDATE USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_sessions_read" ON game_sessions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_sessions_all" ON game_sessions FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_players_read" ON game_players FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_players_all" ON game_players FOR ALL USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_messages_read" ON game_messages FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "game_messages_insert" ON game_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "match_history_read" ON match_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "match_history_insert" ON match_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "reactions_read" ON table_reactions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "reactions_insert" ON table_reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime on game tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE table_reactions;
