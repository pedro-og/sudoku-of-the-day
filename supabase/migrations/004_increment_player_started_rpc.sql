-- ============================================================
-- Daily Sudoku — increment_player_started RPC
--
-- Replaces the direct REST POST to daily_stats (which requires
-- an INSERT RLS policy that we intentionally omit).
-- All writes go through SECURITY DEFINER RPCs.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_player_started(p_puzzle_number INT)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (puzzle_number, players_started, players_solved, total_completion_time)
  VALUES (p_puzzle_number, 1, 0, 0)
  ON CONFLICT (puzzle_number)
  DO UPDATE SET
    players_started = daily_stats.players_started + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
