-- Add map column to games (nullable; old games stay NULL)
-- Allowed: 'Venture' | 'Elite Stronghold' | 'Slurp Rush'

ALTER TABLE games
  ADD COLUMN map TEXT;

ALTER TABLE games
  ADD CONSTRAINT games_map_check
  CHECK (map IS NULL OR map IN ('Venture', 'Elite Stronghold', 'Slurp Rush'));

CREATE INDEX idx_games_map ON games(map) WHERE map IS NOT NULL;
