-- Add Adobe to the allowed map list
-- Safe to run whether or not 002 has been applied yet; the DROP is IF EXISTS.

ALTER TABLE games
  DROP CONSTRAINT IF EXISTS games_map_check;

ALTER TABLE games
  ADD CONSTRAINT games_map_check
  CHECK (map IS NULL OR map IN ('Venture', 'Elite Stronghold', 'Slurp Rush', 'Adobe'));
