-- Seed file: insert all 37 sessions and their games
-- Each game tuple is (place, kills)

BEGIN;

DO $$
DECLARE
  sid UUID;
BEGIN

  -- Session 1: 7/14/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-07-14', '7/14') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 6, 4),
    (gen_random_uuid(), sid, 2, 9, 0),
    (gen_random_uuid(), sid, 3, 4, 9),
    (gen_random_uuid(), sid, 4, 2, 5),
    (gen_random_uuid(), sid, 5, 13, 1),
    (gen_random_uuid(), sid, 6, 2, 5);

  -- Session 2: 7/17/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-07-17', '7/17') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 4, 6),
    (gen_random_uuid(), sid, 2, 6, 6),
    (gen_random_uuid(), sid, 3, 2, 5),
    (gen_random_uuid(), sid, 4, 3, 7),
    (gen_random_uuid(), sid, 5, 5, 9);

  -- Session 3: 7/20/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-07-20', '7/20') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 6, 4),
    (gen_random_uuid(), sid, 2, 2, 1),
    (gen_random_uuid(), sid, 3, 5, 3),
    (gen_random_uuid(), sid, 4, 9, 4),
    (gen_random_uuid(), sid, 5, 3, 5);

  -- Session 4: 7/21/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-07-21', '7/21') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 12, 3),
    (gen_random_uuid(), sid, 2, 2, 6),
    (gen_random_uuid(), sid, 3, 11, 5),
    (gen_random_uuid(), sid, 4, 3, 7),
    (gen_random_uuid(), sid, 5, 18, 0),
    (gen_random_uuid(), sid, 6, 17, 1),
    (gen_random_uuid(), sid, 7, 9, 2),
    (gen_random_uuid(), sid, 8, 1, 5),
    (gen_random_uuid(), sid, 9, 11, 7);

  -- Session 5: 7/28/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-07-28', '7/28') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 5),
    (gen_random_uuid(), sid, 2, 9, 9);

  -- Session 6: 9/1/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-01', '9/1') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 3, 7),
    (gen_random_uuid(), sid, 2, 2, 12),
    (gen_random_uuid(), sid, 3, 2, 5),
    (gen_random_uuid(), sid, 4, 14, 3),
    (gen_random_uuid(), sid, 5, 8, 4),
    (gen_random_uuid(), sid, 6, 2, 11),
    (gen_random_uuid(), sid, 7, 3, 7);

  -- Session 7: 9/6/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-06', '9/6') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 12, 8),
    (gen_random_uuid(), sid, 2, 1, 12),
    (gen_random_uuid(), sid, 3, 10, 4),
    (gen_random_uuid(), sid, 4, 1, 11),
    (gen_random_uuid(), sid, 5, 7, 5);

  -- Session 8: 9/8/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-08', '9/8') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 6, 5),
    (gen_random_uuid(), sid, 2, 1, 10),
    (gen_random_uuid(), sid, 3, 11, 3),
    (gen_random_uuid(), sid, 4, 11, 3),
    (gen_random_uuid(), sid, 5, 13, 1),
    (gen_random_uuid(), sid, 6, 10, 11),
    (gen_random_uuid(), sid, 7, 4, 8);

  -- Session 9: 9/15/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-15', '9/15') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 10, 3),
    (gen_random_uuid(), sid, 2, 14, 0),
    (gen_random_uuid(), sid, 3, 1, 0);

  -- Session 10: 9/22/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-22', '9/22') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 6),
    (gen_random_uuid(), sid, 2, 2, 13),
    (gen_random_uuid(), sid, 3, 10, 2),
    (gen_random_uuid(), sid, 4, 4, 8),
    (gen_random_uuid(), sid, 5, 1, 5),
    (gen_random_uuid(), sid, 6, 3, 6),
    (gen_random_uuid(), sid, 7, 5, 8),
    (gen_random_uuid(), sid, 8, 5, 4);

  -- Session 11: 9/29/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-09-29', '9/29') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 8),
    (gen_random_uuid(), sid, 2, 1, 10),
    (gen_random_uuid(), sid, 3, 4, 10),
    (gen_random_uuid(), sid, 4, 14, 2),
    (gen_random_uuid(), sid, 5, 2, 10),
    (gen_random_uuid(), sid, 6, 5, 3),
    (gen_random_uuid(), sid, 7, 12, 2),
    (gen_random_uuid(), sid, 8, 9, 4);

  -- Session 12: 10/6/2025 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-06', '10/6 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 14, 0),
    (gen_random_uuid(), sid, 2, 6, 3),
    (gen_random_uuid(), sid, 3, 9, 2),
    (gen_random_uuid(), sid, 4, 3, 4),
    (gen_random_uuid(), sid, 5, 18, 0),
    (gen_random_uuid(), sid, 6, 10, 1),
    (gen_random_uuid(), sid, 7, 17, 3),
    (gen_random_uuid(), sid, 8, 15, 2),
    (gen_random_uuid(), sid, 9, 8, 3),
    (gen_random_uuid(), sid, 10, 9, 2),
    (gen_random_uuid(), sid, 11, 17, 3),
    (gen_random_uuid(), sid, 12, 10, 4),
    (gen_random_uuid(), sid, 13, 1, 9);

  -- Session 13: 10/6/2025 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-06', '10/6 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 1, 8),
    (gen_random_uuid(), sid, 2, 10, 1),
    (gen_random_uuid(), sid, 3, 17, 0),
    (gen_random_uuid(), sid, 4, 12, 0),
    (gen_random_uuid(), sid, 5, 13, 0),
    (gen_random_uuid(), sid, 6, 6, 5),
    (gen_random_uuid(), sid, 7, 5, 10),
    (gen_random_uuid(), sid, 8, 3, 7),
    (gen_random_uuid(), sid, 9, 1, 13);

  -- Session 14: 10/15/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-15', '10/15') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 10, 3),
    (gen_random_uuid(), sid, 2, 1, 15),
    (gen_random_uuid(), sid, 3, 13, 2),
    (gen_random_uuid(), sid, 4, 11, 6),
    (gen_random_uuid(), sid, 5, 4, 5),
    (gen_random_uuid(), sid, 6, 5, 8),
    (gen_random_uuid(), sid, 7, 3, 5),
    (gen_random_uuid(), sid, 8, 7, 4),
    (gen_random_uuid(), sid, 9, 19, 0),
    (gen_random_uuid(), sid, 10, 18, 0),
    (gen_random_uuid(), sid, 11, 4, 11);

  -- Session 15: 10/20/2025 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-20', '10/20 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 5),
    (gen_random_uuid(), sid, 2, 2, 11),
    (gen_random_uuid(), sid, 3, 18, 0),
    (gen_random_uuid(), sid, 4, 16, 1),
    (gen_random_uuid(), sid, 5, 5, 4),
    (gen_random_uuid(), sid, 6, 8, 1),
    (gen_random_uuid(), sid, 7, 2, 5),
    (gen_random_uuid(), sid, 8, 19, 0),
    (gen_random_uuid(), sid, 9, 16, 3),
    (gen_random_uuid(), sid, 10, 2, 3);

  -- Session 16: 10/20/2025 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-20', '10/20 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 13, 4),
    (gen_random_uuid(), sid, 2, 3, 4),
    (gen_random_uuid(), sid, 3, 6, 0),
    (gen_random_uuid(), sid, 4, 2, 11),
    (gen_random_uuid(), sid, 5, 7, 5),
    (gen_random_uuid(), sid, 6, 6, 3),
    (gen_random_uuid(), sid, 7, 4, 7);

  -- Session 17: 10/29/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-10-29', '10/29') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 12, 2),
    (gen_random_uuid(), sid, 2, 8, 3),
    (gen_random_uuid(), sid, 3, 12, 2),
    (gen_random_uuid(), sid, 4, 3, 5),
    (gen_random_uuid(), sid, 5, 1, 6),
    (gen_random_uuid(), sid, 6, 7, 5),
    (gen_random_uuid(), sid, 7, 2, 6),
    (gen_random_uuid(), sid, 8, 3, 5),
    (gen_random_uuid(), sid, 9, 4, 9),
    (gen_random_uuid(), sid, 10, 5, 2);

  -- Session 18: 11/3/2025 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-03', '11/3 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 10, 2),
    (gen_random_uuid(), sid, 2, 6, 5),
    (gen_random_uuid(), sid, 3, 4, 6),
    (gen_random_uuid(), sid, 4, 2, 4),
    (gen_random_uuid(), sid, 5, 9, 2),
    (gen_random_uuid(), sid, 6, 12, 1),
    (gen_random_uuid(), sid, 7, 4, 7),
    (gen_random_uuid(), sid, 8, 6, 2),
    (gen_random_uuid(), sid, 9, 4, 5),
    (gen_random_uuid(), sid, 10, 1, 5);

  -- Session 19: 11/3/2025 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-03', '11/3 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 9, 3),
    (gen_random_uuid(), sid, 2, 6, 4),
    (gen_random_uuid(), sid, 3, 3, 1),
    (gen_random_uuid(), sid, 4, 9, 4),
    (gen_random_uuid(), sid, 5, 1, 9),
    (gen_random_uuid(), sid, 6, 8, 5),
    (gen_random_uuid(), sid, 7, 9, 3),
    (gen_random_uuid(), sid, 8, 2, 7),
    (gen_random_uuid(), sid, 9, 9, 3),
    (gen_random_uuid(), sid, 10, 3, 6);

  -- Session 20: 11/10/2025 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-10', '11/10 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 18, 0),
    (gen_random_uuid(), sid, 2, 6, 2),
    (gen_random_uuid(), sid, 3, 5, 7),
    (gen_random_uuid(), sid, 4, 7, 2),
    (gen_random_uuid(), sid, 5, 5, 1),
    (gen_random_uuid(), sid, 6, 1, 6),
    (gen_random_uuid(), sid, 7, 9, 3),
    (gen_random_uuid(), sid, 8, 5, 2),
    (gen_random_uuid(), sid, 9, 5, 1);

  -- Session 21: 11/10/2025 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-10', '11/10 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 9, 2),
    (gen_random_uuid(), sid, 2, 2, 5),
    (gen_random_uuid(), sid, 3, 1, 4),
    (gen_random_uuid(), sid, 4, 1, 8),
    (gen_random_uuid(), sid, 5, 9, 6),
    (gen_random_uuid(), sid, 6, 6, 1);

  -- Session 22: 11/18/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-18', '11/18') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 1, 5),
    (gen_random_uuid(), sid, 2, 17, 1),
    (gen_random_uuid(), sid, 3, 4, 6),
    (gen_random_uuid(), sid, 4, 7, 3),
    (gen_random_uuid(), sid, 5, 3, 7),
    (gen_random_uuid(), sid, 6, 7, 6),
    (gen_random_uuid(), sid, 7, 11, 2),
    (gen_random_uuid(), sid, 8, 19, 0),
    (gen_random_uuid(), sid, 9, 8, 4);

  -- Session 23: 11/24/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-11-24', '11/24') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 6, 1),
    (gen_random_uuid(), sid, 2, 7, 6),
    (gen_random_uuid(), sid, 3, 12, 2),
    (gen_random_uuid(), sid, 4, 12, 6),
    (gen_random_uuid(), sid, 5, 3, 1),
    (gen_random_uuid(), sid, 6, 8, 0);

  -- Session 24: 12/14/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-12-14', '12/14') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 2),
    (gen_random_uuid(), sid, 2, 7, 6),
    (gen_random_uuid(), sid, 3, 1, 16),
    (gen_random_uuid(), sid, 4, 1, 11),
    (gen_random_uuid(), sid, 5, 1, 11);

  -- Session 25: 12/15/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-12-15', '12/15') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 1, 18),
    (gen_random_uuid(), sid, 2, 2, 6),
    (gen_random_uuid(), sid, 3, 5, 6),
    (gen_random_uuid(), sid, 4, 17, 1),
    (gen_random_uuid(), sid, 5, 1, 9),
    (gen_random_uuid(), sid, 6, 1, 9),
    (gen_random_uuid(), sid, 7, 1, 18),
    (gen_random_uuid(), sid, 8, 10, 1),
    (gen_random_uuid(), sid, 9, 4, 13);

  -- Session 26: 12/18/2025 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-12-18', '12/18 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 8, 4),
    (gen_random_uuid(), sid, 2, 1, 10),
    (gen_random_uuid(), sid, 3, 4, 6),
    (gen_random_uuid(), sid, 4, 13, 4),
    (gen_random_uuid(), sid, 5, 6, 8),
    (gen_random_uuid(), sid, 6, 1, 6),
    (gen_random_uuid(), sid, 7, 4, 9),
    (gen_random_uuid(), sid, 8, 8, 6),
    (gen_random_uuid(), sid, 9, 10, 2),
    (gen_random_uuid(), sid, 10, 12, 1),
    (gen_random_uuid(), sid, 11, 8, 0),
    (gen_random_uuid(), sid, 12, 6, 5);

  -- Session 27: 12/18/2025 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-12-18', '12/18 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 5, 6),
    (gen_random_uuid(), sid, 2, 2, 6),
    (gen_random_uuid(), sid, 3, 7, 3),
    (gen_random_uuid(), sid, 4, 2, 2),
    (gen_random_uuid(), sid, 5, 11, 3),
    (gen_random_uuid(), sid, 6, 1, 13);

  -- Session 28: 12/29/2025
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2025-12-29', '12/29') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 5),
    (gen_random_uuid(), sid, 2, 3, 3),
    (gen_random_uuid(), sid, 3, 7, 2),
    (gen_random_uuid(), sid, 4, 4, 2),
    (gen_random_uuid(), sid, 5, 6, 2),
    (gen_random_uuid(), sid, 6, 19, 2),
    (gen_random_uuid(), sid, 7, 1, 8),
    (gen_random_uuid(), sid, 8, 5, 5);

  -- Session 29: 1/13/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-01-13', '1/13') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 9, 0),
    (gen_random_uuid(), sid, 2, 1, 11),
    (gen_random_uuid(), sid, 3, 1, 5),
    (gen_random_uuid(), sid, 4, 3, 7),
    (gen_random_uuid(), sid, 5, 3, 7),
    (gen_random_uuid(), sid, 6, 1, 8),
    (gen_random_uuid(), sid, 7, 6, 6),
    (gen_random_uuid(), sid, 8, 2, 8),
    (gen_random_uuid(), sid, 9, 1, 4);

  -- Session 30: 1/19/2026 (day)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-01-19', '1/19 (day)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 1, 17),
    (gen_random_uuid(), sid, 2, 1, 13),
    (gen_random_uuid(), sid, 3, 7, 3),
    (gen_random_uuid(), sid, 4, 8, 6),
    (gen_random_uuid(), sid, 5, 13, 2),
    (gen_random_uuid(), sid, 6, 3, 13),
    (gen_random_uuid(), sid, 7, 10, 4);

  -- Session 31: 1/19/2026 (night)
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-01-19', '1/19 (night)') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 13, 1),
    (gen_random_uuid(), sid, 2, 10, 2),
    (gen_random_uuid(), sid, 3, 3, 5),
    (gen_random_uuid(), sid, 4, 4, 11),
    (gen_random_uuid(), sid, 5, 9, 4),
    (gen_random_uuid(), sid, 6, 1, 14),
    (gen_random_uuid(), sid, 7, 8, 1),
    (gen_random_uuid(), sid, 8, 2, 15),
    (gen_random_uuid(), sid, 9, 15, 1),
    (gen_random_uuid(), sid, 10, 15, 3);

  -- Session 32: 1/24/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-01-24', '1/24') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 10, 3),
    (gen_random_uuid(), sid, 2, 6, 5),
    (gen_random_uuid(), sid, 3, 7, 6),
    (gen_random_uuid(), sid, 4, 1, 15),
    (gen_random_uuid(), sid, 5, 16, 1),
    (gen_random_uuid(), sid, 6, 3, 4),
    (gen_random_uuid(), sid, 7, 9, 3),
    (gen_random_uuid(), sid, 8, 13, 2),
    (gen_random_uuid(), sid, 9, 14, 2),
    (gen_random_uuid(), sid, 10, 8, 6),
    (gen_random_uuid(), sid, 11, 3, 12),
    (gen_random_uuid(), sid, 12, 13, 3),
    (gen_random_uuid(), sid, 13, 15, 0),
    (gen_random_uuid(), sid, 14, 1, 8);

  -- Session 33: 1/25/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-01-25', '1/25') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 3, 7),
    (gen_random_uuid(), sid, 2, 6, 4),
    (gen_random_uuid(), sid, 3, 8, 7),
    (gen_random_uuid(), sid, 4, 2, 5),
    (gen_random_uuid(), sid, 5, 1, 15),
    (gen_random_uuid(), sid, 6, 1, 8),
    (gen_random_uuid(), sid, 7, 8, 8),
    (gen_random_uuid(), sid, 8, 1, 6);

  -- Session 34: 2/26/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-02-26', '2/26') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 3, 10),
    (gen_random_uuid(), sid, 2, 5, 8),
    (gen_random_uuid(), sid, 3, 2, 5),
    (gen_random_uuid(), sid, 4, 9, 9),
    (gen_random_uuid(), sid, 5, 11, 7),
    (gen_random_uuid(), sid, 6, 17, 1),
    (gen_random_uuid(), sid, 7, 2, 4),
    (gen_random_uuid(), sid, 8, 11, 3),
    (gen_random_uuid(), sid, 9, 9, 2),
    (gen_random_uuid(), sid, 10, 14, 2),
    (gen_random_uuid(), sid, 11, 12, 2),
    (gen_random_uuid(), sid, 12, 17, 1),
    (gen_random_uuid(), sid, 13, 11, 1),
    (gen_random_uuid(), sid, 14, 15, 2),
    (gen_random_uuid(), sid, 15, 6, 5),
    (gen_random_uuid(), sid, 16, 17, 1);

  -- Session 35: 3/2/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-03-02', '3/2') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 4, 10),
    (gen_random_uuid(), sid, 2, 10, 5),
    (gen_random_uuid(), sid, 3, 1, 9),
    (gen_random_uuid(), sid, 4, 8, 1),
    (gen_random_uuid(), sid, 5, 2, 16),
    (gen_random_uuid(), sid, 6, 7, 4),
    (gen_random_uuid(), sid, 7, 10, 2),
    (gen_random_uuid(), sid, 8, 4, 6),
    (gen_random_uuid(), sid, 9, 1, 12);

  -- Session 36: 3/2/2026 Cash Cup
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-03-02', '3/2 Cash Cup') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 4, 1),
    (gen_random_uuid(), sid, 2, 17, 1),
    (gen_random_uuid(), sid, 3, 6, 5),
    (gen_random_uuid(), sid, 4, 6, 3),
    (gen_random_uuid(), sid, 5, 8, 0),
    (gen_random_uuid(), sid, 6, 12, 0),
    (gen_random_uuid(), sid, 7, 7, 4),
    (gen_random_uuid(), sid, 8, 11, 3),
    (gen_random_uuid(), sid, 9, 10, 4),
    (gen_random_uuid(), sid, 10, 2, 14);

  -- Session 37: 3/11/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-03-11', '3/11') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 6),
    (gen_random_uuid(), sid, 2, 4, 3),
    (gen_random_uuid(), sid, 3, 3, 8),
    (gen_random_uuid(), sid, 4, 18, 0),
    (gen_random_uuid(), sid, 5, 8, 1),
    (gen_random_uuid(), sid, 6, 1, 15),
    (gen_random_uuid(), sid, 7, 1, 17),
    (gen_random_uuid(), sid, 8, 2, 6),
    (gen_random_uuid(), sid, 9, 7, 7),
    (gen_random_uuid(), sid, 10, 1, 16),
    (gen_random_uuid(), sid, 11, 8, 6),
    (gen_random_uuid(), sid, 12, 8, 9),
    (gen_random_uuid(), sid, 13, 12, 3),
    (gen_random_uuid(), sid, 14, 14, 1),
    (gen_random_uuid(), sid, 15, 2, 9);

  -- Session 38: 3/17/2026
  INSERT INTO sessions (id, played_at, label) VALUES (gen_random_uuid(), '2026-03-17', '3/17') RETURNING id INTO sid;
  INSERT INTO games (id, session_id, game_order, place, kills) VALUES
    (gen_random_uuid(), sid, 1, 2, 5),
    (gen_random_uuid(), sid, 2, 10, 7),
    (gen_random_uuid(), sid, 3, 6, 8),
    (gen_random_uuid(), sid, 4, 8, 3),
    (gen_random_uuid(), sid, 5, 2, 10),
    (gen_random_uuid(), sid, 6, 9, 3),
    (gen_random_uuid(), sid, 7, 1, 11),
    (gen_random_uuid(), sid, 8, 1, 12),
    (gen_random_uuid(), sid, 9, 8, 2),
    (gen_random_uuid(), sid, 10, 11, 2);

END $$;

COMMIT;
