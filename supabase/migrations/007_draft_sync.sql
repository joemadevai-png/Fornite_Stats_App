-- Shared draft sync hardening.
--
-- Adds a server-authoritative revision counter so clients can order updates and
-- drop stale ones, and makes Realtime publication membership assert loudly
-- instead of failing silently.
--
-- Migrations 004 and 006 wrapped their ALTER PUBLICATION in
--   DO $$ BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END $$;
-- which swallows every error. That made it impossible to tell whether Realtime
-- was ever actually enabled. This migration re-asserts membership and raises if
-- it still isn't there afterwards.

-- ---------------------------------------------------------------- columns ---

ALTER TABLE session_drafts
  ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;

ALTER TABLE session_drafts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------- trigger ---
-- Server-authoritative: a client-supplied revision could not be trusted to be
-- monotonic (stale reads, skewed clocks). PostgREST upsert compiles to
-- INSERT ... ON CONFLICT DO UPDATE, so BEFORE UPDATE covers the normal path.

CREATE OR REPLACE FUNCTION bump_session_draft_revision()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' THEN
    NEW.revision := COALESCE(OLD.revision, 0) + 1;
  ELSE
    NEW.revision := 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS session_drafts_bump_revision ON session_drafts;

CREATE TRIGGER session_drafts_bump_revision
  BEFORE INSERT OR UPDATE ON session_drafts
  FOR EACH ROW EXECUTE FUNCTION bump_session_draft_revision();

-- Guarantee the singleton row exists
INSERT INTO session_drafts (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------ publication ---
-- The IF NOT EXISTS check IS the idempotency, so no exception handler is
-- needed and any real failure propagates.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'publication supabase_realtime is missing; Realtime is not provisioned on this project';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'session_drafts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_drafts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'maps'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.maps;
  END IF;
END $$;

-- Assert it actually took, rather than trusting the block above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'session_drafts'
  ) THEN
    RAISE EXCEPTION 'session_drafts is still not in the supabase_realtime publication';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'maps'
  ) THEN
    RAISE EXCEPTION 'maps is still not in the supabase_realtime publication';
  END IF;
END $$;
