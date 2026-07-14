-- Shared, real-time log draft
-- Singleton row: id must always be 1. Both devices read/write the same row.

CREATE TABLE IF NOT EXISTS session_drafts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  played_at TEXT,
  label TEXT,
  games JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by TEXT
);

INSERT INTO session_drafts (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Match the open-access setup of the other tables
ALTER TABLE session_drafts DISABLE ROW LEVEL SECURITY;

-- Broadcast changes over Supabase Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_drafts;
EXCEPTION WHEN OTHERS THEN
  -- publication missing or table already added; skip
  NULL;
END $$;
