-- ============================================================
-- Daily Sudoku — Fix anti-bot guards
--
-- Problem: Guard 3 (inter-cell timing) was optional — it only
-- ran if p_cell_intervals had >= 10 elements. A bot sending an
-- empty array or < 10 elements with p_solved = true would pass
-- Guard 2 (cells_filled >= 15) and then skip Guard 3 entirely.
--
-- Fix: When p_solved = true, Guard 3 is now mandatory.
--   - Require >= 14 intervals (= 15 cells filled, same as Guard 2).
--   - If array is too short for a solved submission → reject.
--   - Collapse fast-fill bursts first, then check median >= 150ms.
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
  manual_intervals INT[];
  median_interval NUMERIC;
  cells_filled INT;
  -- Thresholds
  MIN_ELAPSED_SECONDS CONSTANT INT := 30;
  MIN_CELLS_FILLED    CONSTANT INT := 15;  -- need >= 15 cells = >= 14 intervals
  MIN_MEDIAN_MS       CONSTANT INT := 150; -- minimum median inter-cell interval
BEGIN
  -- ── Guard 1: Hard time floor ──────────────────────────────
  IF p_elapsed_seconds < MIN_ELAPSED_SECONDS THEN
    RETURN;
  END IF;

  -- ── Guard 2 + 3 (solved submissions only) ────────────────
  -- For a valid solve, the player must have filled >= 15 cells
  -- AND the timing between those cells must look human.
  IF p_solved THEN
    cells_filled := COALESCE(array_length(p_cell_intervals, 1), 0) + 1;

    -- Guard 2: not enough cells recorded → reject
    IF cells_filled < MIN_CELLS_FILLED THEN
      RETURN;
    END IF;

    -- Guard 3: inter-cell timing is now mandatory for solved submissions.
    -- Collapse fast-fill bursts (auto-complete from one trigger) first.
    manual_intervals := collapse_fast_fill_bursts(p_cell_intervals, 80);

    -- After collapsing bursts, if too few manual intervals remain → reject.
    -- (This catches bots that fill everything in one rapid burst.)
    IF COALESCE(array_length(manual_intervals, 1), 0) < 5 THEN
      RETURN;
    END IF;

    -- Median of manual intervals must be >= 150ms.
    median_interval := array_median(manual_intervals);
    IF median_interval IS NULL OR median_interval < MIN_MEDIAN_MS THEN
      RETURN;
    END IF;
  END IF;

  -- ── All guards passed: record the completion ──────────────

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
