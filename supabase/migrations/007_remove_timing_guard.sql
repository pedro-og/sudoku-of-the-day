-- ============================================================
-- Daily Sudoku — Remove inter-cell timing guard (Guard 3)
--
-- Reason: fast-fill is a valid game feature. Collapsing bursts
-- and checking median inter-cell intervals incorrectly rejects
-- legitimate players who use fast-fill heavily.
--
-- Retained guards:
--   1. Hard time floor: reject completions < 30s total elapsed
--   2. Cell count floor: solved submissions must have >= 15 cells
--
-- Also removes the now-unused helper functions.
-- ============================================================

CREATE OR REPLACE FUNCTION record_completion(
  p_player_id UUID,
  p_puzzle_number INT,
  p_elapsed_seconds INT,
  p_mistakes INT,
  p_solved BOOLEAN,
  p_puzzle_date DATE,
  p_cell_intervals INT[] DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  cells_filled INT;
  MIN_ELAPSED_SECONDS CONSTANT INT := 30;
  MIN_CELLS_FILLED    CONSTANT INT := 15;
BEGIN
  -- Guard 1: Hard time floor
  IF p_elapsed_seconds < MIN_ELAPSED_SECONDS THEN
    RETURN;
  END IF;

  -- Guard 2: Cell count floor (solved only)
  IF p_solved THEN
    cells_filled := COALESCE(array_length(p_cell_intervals, 1), 0) + 1;
    IF cells_filled < MIN_CELLS_FILLED THEN
      RETURN;
    END IF;
  END IF;

  -- All guards passed: record the completion

  INSERT INTO players (id)
  VALUES (p_player_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved)
  VALUES (p_player_id, p_puzzle_number, p_elapsed_seconds, p_mistakes, p_solved)
  ON CONFLICT (player_id, puzzle_number) DO NOTHING;

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

    INSERT INTO daily_stats (puzzle_number, players_started, players_solved, total_completion_time)
    VALUES (p_puzzle_number, 0, 1, p_elapsed_seconds)
    ON CONFLICT (puzzle_number)
    DO UPDATE SET
      players_solved = daily_stats.players_solved + 1,
      total_completion_time = daily_stats.total_completion_time + p_elapsed_seconds;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove now-unused helper functions
DROP FUNCTION IF EXISTS collapse_fast_fill_bursts(INT[], INT);
DROP FUNCTION IF EXISTS array_median(INT[]);
