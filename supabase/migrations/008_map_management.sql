-- Map management: recency ordering, plus atomic rename and merge.
--
-- games.map stores the map NAME as plain text with no foreign key, so renaming
-- a row in `maps` would otherwise orphan every game logged under the old name
-- and split that map's history in the stats. Rename and merge therefore run as
-- functions, which execute in a single transaction and keep both tables in step.

-- -------------------------------------------------------------- recency ----
-- Ordering the Log dropdown by "most recently used" needs a per-map timestamp.
-- It is bumped when a session is saved, not while the draft is being typed, so
-- the dropdown order stays stable mid-session instead of reshuffling between
-- games.

ALTER TABLE maps
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

UPDATE maps m
   SET last_used_at = (SELECT MAX(g.created_at) FROM games g WHERE g.map = m.name)
 WHERE m.last_used_at IS NULL;

-- --------------------------------------------------------------- rename ----

CREATE OR REPLACE FUNCTION rename_map(p_old TEXT, p_new TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_new   TEXT := btrim(p_new);
  v_games INTEGER;
BEGIN
  IF v_new = '' THEN
    RAISE EXCEPTION 'Map name cannot be empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM maps WHERE name = p_old) THEN
    RAISE EXCEPTION 'No map named %', p_old;
  END IF;

  IF v_new <> p_old AND EXISTS (SELECT 1 FROM maps WHERE name = v_new) THEN
    RAISE EXCEPTION 'A map named % already exists. Merge them instead.', v_new;
  END IF;

  UPDATE maps  SET name = v_new WHERE name = p_old;
  UPDATE games SET map  = v_new WHERE map  = p_old;
  GET DIAGNOSTICS v_games = ROW_COUNT;

  RETURN v_games;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------- merge ----
-- Moves every game off p_from onto p_into and drops p_from. This is the only
-- way to combine two maps, because maps.name is UNIQUE so renaming one onto
-- the other would just fail.

CREATE OR REPLACE FUNCTION merge_maps(p_from TEXT, p_into TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_games INTEGER;
BEGIN
  IF p_from = p_into THEN
    RAISE EXCEPTION 'Cannot merge a map into itself';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM maps WHERE name = p_from) THEN
    RAISE EXCEPTION 'No map named %', p_from;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM maps WHERE name = p_into) THEN
    RAISE EXCEPTION 'No map named %', p_into;
  END IF;

  UPDATE games SET map = p_into WHERE map = p_from;
  GET DIAGNOSTICS v_games = ROW_COUNT;

  DELETE FROM maps WHERE name = p_from;

  UPDATE maps
     SET last_used_at = (SELECT MAX(created_at) FROM games WHERE map = p_into)
   WHERE name = p_into;

  RETURN v_games;
END;
$$ LANGUAGE plpgsql;

-- The app is intentionally open and runs as anon; match the tables.
GRANT EXECUTE ON FUNCTION rename_map(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION merge_maps(TEXT, TEXT) TO anon, authenticated;

-- Assert, never swallow: migrations 004/006 hid publication failures behind
-- EXCEPTION WHEN OTHERS THEN NULL and nobody could tell Realtime was off.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'maps'
  ) THEN
    RAISE EXCEPTION 'maps is not in the supabase_realtime publication';
  END IF;
END $$;
