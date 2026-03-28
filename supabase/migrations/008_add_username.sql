-- ============================================================
-- Daily Sudoku — Add username to players
-- Adds a display username column and updates RPCs to return it
-- ============================================================

-- 1. Add username column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS username TEXT DEFAULT NULL;

-- 2. Update ensure_player to accept and store username
CREATE OR REPLACE FUNCTION ensure_player(p_id UUID, p_username TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO players (id, username)
  VALUES (p_id, p_username)
  ON CONFLICT (id) DO UPDATE
    SET username = COALESCE(EXCLUDED.username, players.username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update get_streak_leaderboard to return username
CREATE OR REPLACE FUNCTION get_streak_leaderboard(
  p_player_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  player_rank INT;
  player_streak INT;
  leaderboard JSON;
  safe_limit INT := LEAST(GREATEST(p_limit, 1), 100);
BEGIN
  SELECT current_streak INTO player_streak
  FROM players WHERE id = p_player_id;

  SELECT COUNT(*) + 1 INTO player_rank
  FROM players
  WHERE current_streak > COALESCE(player_streak, 0);

  SELECT json_agg(row_to_json(t)) INTO leaderboard
  FROM (
    SELECT
      id AS player_id,
      username,
      current_streak,
      longest_streak,
      ROW_NUMBER() OVER (ORDER BY current_streak DESC) AS rank,
      COUNT(*) OVER () AS total_players_with_streaks
    FROM players
    WHERE current_streak > 0
    ORDER BY current_streak DESC
    LIMIT safe_limit
  ) t;

  RETURN json_build_object(
    'player_rank', player_rank,
    'player_streak', COALESCE(player_streak, 0),
    'total_players_with_streaks', COALESCE(
      (SELECT total_players_with_streaks FROM json_to_recordset(leaderboard) AS x(total_players_with_streaks BIGINT) LIMIT 1),
      0
    ),
    'leaderboard', COALESCE(
      (SELECT json_agg(json_build_object(
        'player_id', (elem->>'player_id'),
        'username', (elem->>'username'),
        'current_streak', (elem->>'current_streak')::INT,
        'longest_streak', (elem->>'longest_streak')::INT,
        'rank', (elem->>'rank')::INT
      ))
      FROM json_array_elements(leaderboard) AS elem),
      '[]'::json
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_speed_leaderboard to return username
CREATE OR REPLACE FUNCTION get_speed_leaderboard(
  p_player_id UUID,
  p_puzzle_number INT,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  player_time INT;
  player_rank INT;
  leaderboard JSON;
  total_solvers INT;
  safe_limit INT := LEAST(GREATEST(p_limit, 1), 100);
BEGIN
  SELECT elapsed_seconds INTO player_time
  FROM completions
  WHERE player_id = p_player_id
    AND puzzle_number = p_puzzle_number
    AND solved = true;

  SELECT COUNT(*) INTO total_solvers
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = true;

  IF player_time IS NOT NULL THEN
    SELECT COUNT(*) + 1 INTO player_rank
    FROM completions
    WHERE puzzle_number = p_puzzle_number
      AND solved = true
      AND elapsed_seconds < player_time;
  ELSE
    player_rank := NULL;
  END IF;

  SELECT json_agg(row_to_json(t)) INTO leaderboard
  FROM (
    SELECT
      c.player_id,
      p.username,
      c.elapsed_seconds,
      ROW_NUMBER() OVER (ORDER BY c.elapsed_seconds ASC) AS rank
    FROM completions c
    LEFT JOIN players p ON p.id = c.player_id
    WHERE c.puzzle_number = p_puzzle_number
      AND c.solved = true
    ORDER BY c.elapsed_seconds ASC
    LIMIT safe_limit
  ) t;

  RETURN json_build_object(
    'player_rank', player_rank,
    'player_time', player_time,
    'total_solvers', COALESCE(total_solvers, 0),
    'leaderboard', COALESCE(leaderboard, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
