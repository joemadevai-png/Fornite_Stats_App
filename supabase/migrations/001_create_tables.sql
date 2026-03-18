-- Fort Stats: sessions + games tables
-- Run this in Supabase SQL Editor

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  played_at DATE NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  game_order INTEGER NOT NULL,
  place INTEGER NOT NULL CHECK (place >= 1),
  kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_date ON sessions(played_at DESC);
CREATE INDEX idx_games_session ON games(session_id, game_order);

-- RLS: all authenticated users can read and write everything
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sessions"
  ON sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sessions"
  ON sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON sessions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete sessions"
  ON sessions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read games"
  ON games FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert games"
  ON games FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update games"
  ON games FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete games"
  ON games FOR DELETE TO authenticated USING (true);
