-- Add Simpsons to the allowed map list
-- Safe to run whether or not earlier migrations have been applied yet.

ALTER TABLE games
  DROP CONSTRAINT IF EXISTS games_map_check;

ALTER TABLE games
  ADD CONSTRAINT games_map_check
  CHECK (map IS NULL OR map IN ('Venture', 'Elite Stronghold', 'Slurp Rush', 'Adobe', 'Simpsons'));
