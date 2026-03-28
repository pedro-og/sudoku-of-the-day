-- ============================================================
-- Daily Sudoku — Global Stats & Leaderboard
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Players table (anonymous identity, future-auth-ready)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_completed_date DATE DEFAULT NULL
);

-- 2. Individual completion records
CREATE TABLE IF NOT EXISTS completions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id),
  puzzle_number INT NOT NULL,
  elapsed_seconds INT NOT NULL,
  mistakes INT NOT NULL,
  solved BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, puzzle_number)
);

-- 3. Aggregate stats per puzzle (backward compatible)
CREATE TABLE IF NOT EXISTS daily_stats (
  puzzle_number BIGINT PRIMARY KEY,
  players_started BIGINT DEFAULT 0,
  players_solved BIGINT DEFAULT 0,
  total_completion_time BIGINT DEFAULT 0
);

-- 5. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_completions_puzzle_solved
  ON completions(puzzle_number, solved, elapsed_seconds);

CREATE INDEX IF NOT EXISTS idx_players_streak
  ON players(current_streak DESC);

-- 6. Row Level Security (all access via SECURITY DEFINER RPCs)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated to read daily_stats via REST API
CREATE POLICY "Allow public read of daily_stats"
  ON daily_stats FOR SELECT
  USING (true);

-- ============================================================
-- RPC 1: ensure_player
-- Upserts a player row on first visit
-- ============================================================
CREATE OR REPLACE FUNCTION ensure_player(p_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO players (id)
  VALUES (p_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 2: record_completion
-- Records an individual completion + updates streak + updates
-- the aggregate daily_stats table atomically
-- ============================================================
CREATE OR REPLACE FUNCTION record_completion(
  p_player_id UUID,
  p_puzzle_number INT,
  p_elapsed_seconds INT,
  p_mistakes INT,
  p_solved BOOLEAN,
  p_puzzle_date DATE
)
RETURNS void AS $$
BEGIN
  -- Ensure player exists
  INSERT INTO players (id)
  VALUES (p_player_id)
  ON CONFLICT (id) DO NOTHING;

  -- Insert completion (skip if duplicate)
  INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved)
  VALUES (p_player_id, p_puzzle_number, p_elapsed_seconds, p_mistakes, p_solved)
  ON CONFLICT (player_id, puzzle_number) DO NOTHING;

  -- Update streak if solved
  IF p_solved THEN
    UPDATE players
    SET
      current_streak = CASE
        WHEN last_completed_date = p_puzzle_date - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_completed_date = p_puzzle_date THEN current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(
        longest_streak,
        CASE
          WHEN last_completed_date = p_puzzle_date - INTERVAL '1 day' THEN current_streak + 1
          WHEN last_completed_date = p_puzzle_date THEN current_streak
          ELSE 1
        END
      ),
      last_completed_date = CASE
        WHEN last_completed_date = p_puzzle_date THEN last_completed_date
        ELSE p_puzzle_date
      END
    WHERE id = p_player_id;

    -- Update aggregate table (backward compatible)
    INSERT INTO daily_stats (puzzle_number, players_started, players_solved, total_completion_time)
    VALUES (p_puzzle_number, 0, 1, p_elapsed_seconds)
    ON CONFLICT (puzzle_number)
    DO UPDATE SET
      players_solved = daily_stats.players_solved + 1,
      total_completion_time = daily_stats.total_completion_time + p_elapsed_seconds;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 3: get_puzzle_stats
-- Returns percentile, averages, and totals for a puzzle
-- ============================================================
CREATE OR REPLACE FUNCTION get_puzzle_stats(
  p_puzzle_number INT,
  p_elapsed_seconds INT
)
RETURNS JSON AS $$
DECLARE
  total_solvers INT;
  slower_count INT;
  avg_solve_time NUMERIC;
  avg_fail_mistakes NUMERIC;
  total_failures INT;
  percentile NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_solvers
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = true;

  SELECT COUNT(*) INTO slower_count
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = true
    AND elapsed_seconds > p_elapsed_seconds;

  SELECT COALESCE(AVG(elapsed_seconds), 0) INTO avg_solve_time
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = true;

  SELECT COUNT(*), COALESCE(AVG(mistakes), 0)
  INTO total_failures, avg_fail_mistakes
  FROM completions
  WHERE puzzle_number = p_puzzle_number AND solved = false;

  IF total_solvers > 0 THEN
    percentile := ROUND((slower_count::NUMERIC / total_solvers) * 100);
  ELSE
    percentile := 0;
  END IF;

  RETURN json_build_object(
    'total_solvers', total_solvers,
    'total_failures', total_failures,
    'percentile', percentile,
    'avg_solve_time_seconds', ROUND(avg_solve_time),
    'avg_fail_mistakes', ROUND(avg_fail_mistakes, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC 4: get_streak_leaderboard
-- Returns top N streaks + the requesting player's rank
-- ============================================================
CREATE OR REPLACE FUNCTION get_streak_leaderboard(
  p_player_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  player_rank INT;
  player_streak INT;
  leaderboard JSON;
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
      current_streak,
      longest_streak,
      ROW_NUMBER() OVER (ORDER BY current_streak DESC) AS rank
    FROM players
    WHERE current_streak > 0
    ORDER BY current_streak DESC
    LIMIT p_limit
  ) t;

  RETURN json_build_object(
    'player_rank', player_rank,
    'player_streak', COALESCE(player_streak, 0),
    'total_players_with_streaks', (SELECT COUNT(*) FROM players WHERE current_streak > 0),
    'leaderboard', COALESCE(leaderboard, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
