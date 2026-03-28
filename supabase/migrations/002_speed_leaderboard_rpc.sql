-- ============================================================
-- Daily Sudoku — Speed Leaderboard RPC
-- Returns top N fastest solvers for a puzzle + player's rank
-- ============================================================

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
BEGIN
  -- Get the requesting player's time for this puzzle
  SELECT elapsed_seconds INTO player_time
  FROM completions
  WHERE player_id = p_player_id
    AND puzzle_number = p_puzzle_number
    AND solved = true;

  -- Count total solvers
  SELECT COUNT(*) INTO total_solvers
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = true;

  -- Calculate player's rank (1-based, by speed ascending)
  IF player_time IS NOT NULL THEN
    SELECT COUNT(*) + 1 INTO player_rank
    FROM completions
    WHERE puzzle_number = p_puzzle_number
      AND solved = true
      AND elapsed_seconds < player_time;
  ELSE
    player_rank := NULL;
  END IF;

  -- Get top N fastest solvers
  SELECT json_agg(row_to_json(t)) INTO leaderboard
  FROM (
    SELECT
      c.player_id,
      c.elapsed_seconds,
      ROW_NUMBER() OVER (ORDER BY c.elapsed_seconds ASC) AS rank
    FROM completions c
    WHERE c.puzzle_number = p_puzzle_number
      AND c.solved = true
    ORDER BY c.elapsed_seconds ASC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'player_rank', player_rank,
    'player_time', player_time,
    'total_solvers', COALESCE(total_solvers, 0),
    'leaderboard', COALESCE(leaderboard, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
