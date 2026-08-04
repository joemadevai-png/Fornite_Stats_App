-- Dynamic maps: store the map list in a table so users can add new maps from the UI
-- Drops the hardcoded CHECK constraint on games.map.

CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 5 existing maps in cycle order (created_at determines cycle order)
INSERT INTO maps (name, created_at) VALUES
  ('Venture',          NOW() - INTERVAL '5 minutes'),
  ('Elite Stronghold', NOW() - INTERVAL '4 minutes'),
  ('Slurp Rush',       NOW() - INTERVAL '3 minutes'),
  ('Adobe',            NOW() - INTERVAL '2 minutes'),
  ('Simpsons',         NOW() - INTERVAL '1 minute')
ON CONFLICT (name) DO NOTHING;

-- Drop the hardcoded map-value CHECK; the app owns the list now
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_map_check;

-- Match open-access pattern of the other tables
ALTER TABLE maps DISABLE ROW LEVEL SECURITY;

-- Broadcast changes so /log tabs see new maps live
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE maps;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
