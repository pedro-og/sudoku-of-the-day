-- ============================================================
-- Daily Sudoku — Query optimizations
--
-- Fixes identified by Postgres best practices review:
--   1. Add missing index on completions(player_id) — FK column
--      was unindexed, causing full table scans on player lookups.
--   2. Collapse 4 separate scans in get_puzzle_stats into one.
--   3. Fold redundant COUNT(*) in get_streak_leaderboard into
--      a window function (eliminates extra sequential scan).
--   4. Cap p_limit to 100 in leaderboard RPCs to prevent abuse.
-- ============================================================


-- ── 1. Index on completions(player_id) ──────────────────────
-- The existing composite index starts with puzzle_number, so
-- player-first lookups (e.g. "did this player solve today?")
-- cause a full table scan. FK columns must always be indexed.
CREATE INDEX IF NOT EXISTS idx_completions_player_id
  ON completions(player_id);


-- ── 2. get_puzzle_stats — single-scan rewrite ────────────────
-- Old version: 4 separate queries, each scanning completions
-- for the same puzzle_number. New version: one index scan with
-- conditional aggregation via FILTER.
CREATE OR REPLACE FUNCTION get_puzzle_stats(
  p_puzzle_number INT,
  p_elapsed_seconds INT
)
RETURNS JSON AS $$
DECLARE
  total_solvers   INT;
  slower_count    INT;
  avg_solve_time  NUMERIC;
  total_failures  INT;
  avg_fail_mistakes NUMERIC;
  percentile      NUMERIC;
BEGIN
  SELECT
    COUNT(*)                        FILTER (WHERE solved = true),
    COUNT(*)                        FILTER (WHERE solved = true AND elapsed_seconds > p_elapsed_seconds),
    COALESCE(AVG(elapsed_seconds)   FILTER (WHERE solved = true), 0),
    COUNT(*)                        FILTER (WHERE solved = false),
    COALESCE(AVG(mistakes)          FILTER (WHERE solved = false), 0)
  INTO total_solvers, slower_count, avg_solve_time, total_failures, avg_fail_mistakes
  FROM completions
  WHERE puzzle_number = p_puzzle_number;

  IF total_solvers > 0 THEN
    percentile := ROUND((slower_count::NUMERIC / total_solvers) * 100);
  ELSE
    percentile := 0;
  END IF;

  RETURN json_build_object(
    'total_solvers',          total_solvers,
    'total_failures',         total_failures,
    'percentile',             percentile,
    'avg_solve_time_seconds', ROUND(avg_solve_time),
    'avg_fail_mistakes',      ROUND(avg_fail_mistakes, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. get_streak_leaderboard — eliminate redundant COUNT scan ─
-- Old version ran a separate "SELECT COUNT(*) FROM players WHERE
-- current_streak > 0" after the leaderboard query — a second
-- sequential scan. New version folds it into a window function.
-- Also caps p_limit to 100 to prevent unbounded result sets.
CREATE OR REPLACE FUNCTION get_streak_leaderboard(
  p_player_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  player_rank   INT;
  player_streak INT;
  leaderboard   JSON;
  total_with_streaks BIGINT;
BEGIN
  p_limit := LEAST(p_limit, 100);

  SELECT current_streak INTO player_streak
  FROM players WHERE id = p_player_id;

  SELECT COUNT(*) + 1 INTO player_rank
  FROM players
  WHERE current_streak > COALESCE(player_streak, 0);

  SELECT
    json_agg(row_to_json(t)),
    MAX(t.total_with_streaks)
  INTO leaderboard, total_with_streaks
  FROM (
    SELECT
      id AS player_id,
      current_streak,
      longest_streak,
      ROW_NUMBER() OVER (ORDER BY current_streak DESC) AS rank,
      COUNT(*) OVER ()                                  AS total_with_streaks
    FROM players
    WHERE current_streak > 0
    ORDER BY current_streak DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'player_rank',                player_rank,
    'player_streak',              COALESCE(player_streak, 0),
    'total_players_with_streaks', COALESCE(total_with_streaks, 0),
    'leaderboard',                COALESCE(leaderboard, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. get_speed_leaderboard — cap p_limit ───────────────────
CREATE OR REPLACE FUNCTION get_speed_leaderboard(
  p_player_id UUID,
  p_puzzle_number INT,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  player_time   INT;
  player_rank   INT;
  leaderboard   JSON;
  total_solvers INT;
BEGIN
  p_limit := LEAST(p_limit, 100);

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
      c.elapsed_seconds,
      ROW_NUMBER() OVER (ORDER BY c.elapsed_seconds ASC) AS rank
    FROM completions c
    WHERE c.puzzle_number = p_puzzle_number
      AND c.solved = true
    ORDER BY c.elapsed_seconds ASC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'player_rank',  player_rank,
    'player_time',  player_time,
    'total_solvers', COALESCE(total_solvers, 0),
    'leaderboard',  COALESCE(leaderboard, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
