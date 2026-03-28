-- ============================================================
-- Daily Sudoku — Anti-Bot Validation
-- Adds server-side honeypot validation to record_completion.
--
-- Strategy:
--   1. Hard time floor: reject completions < 30s total elapsed
--   2. Cell count floor: player must have filled >= 15 cells manually
--      (intervals array has N-1 entries for N cells filled)
--   3. Inter-cell timing: compute the median of "manual" intervals
--      (bursts < 80ms are collapsed into a single human input,
--       as they represent fast-fill auto-completions from one trigger)
--      Reject if median manual interval < 150ms
--
-- Thresholds calibration:
--   - World-class human expert: ~90s total, ~1-2s per deliberate move
--   - Fast-fill burst: < 80ms between auto-completed cells (1 trigger)
--   - Human keyboard/mouse minimum latency: ~150ms between deliberate fills
--   - Bot: fills all 51 cells in < 1s with near-zero inter-cell delay
-- ============================================================

-- Helper function: compute median of an integer array
CREATE OR REPLACE FUNCTION array_median(arr INT[])
RETURNS NUMERIC AS $$
DECLARE
  sorted INT[];
  n INT;
BEGIN
  IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT ARRAY_AGG(v ORDER BY v) INTO sorted FROM UNNEST(arr) v;
  n := array_length(sorted, 1);
  IF n % 2 = 1 THEN
    RETURN sorted[(n + 1) / 2];
  ELSE
    RETURN (sorted[n / 2] + sorted[n / 2 + 1]) / 2.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function: collapse fast-fill bursts and return "manual" intervals.
-- A burst is a run of consecutive intervals all < 80ms (auto-fill from one trigger).
-- Each burst collapses to a single interval = sum of the burst.
-- Returns the array of manual intervals (one per deliberate human input gap).
CREATE OR REPLACE FUNCTION collapse_fast_fill_bursts(intervals INT[], burst_threshold_ms INT DEFAULT 80)
RETURNS INT[] AS $$
DECLARE
  result INT[] := '{}';
  accumulator INT := 0;
  in_burst BOOLEAN := false;
  v INT;
BEGIN
  IF intervals IS NULL OR array_length(intervals, 1) IS NULL THEN
    RETURN '{}';
  END IF;

  FOREACH v IN ARRAY intervals LOOP
    IF v < burst_threshold_ms THEN
      -- Part of a fast-fill burst: accumulate
      accumulator := accumulator + v;
      in_burst := true;
    ELSE
      IF in_burst THEN
        -- Burst just ended: flush accumulated burst as one manual interval
        result := array_append(result, accumulator + v);
        accumulator := 0;
        in_burst := false;
      ELSE
        -- Normal manual interval
        result := array_append(result, v);
      END IF;
    END IF;
  END LOOP;

  -- Flush any trailing burst
  IF in_burst AND accumulator > 0 THEN
    result := array_append(result, accumulator);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- Updated record_completion with anti-bot validation
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
  -- A Sudoku cannot be solved by a human in under 30 seconds.
  IF p_elapsed_seconds < MIN_ELAPSED_SECONDS THEN
    RETURN;
  END IF;

  -- ── Guard 2: Cell count floor ─────────────────────────────
  -- p_cell_intervals has N-1 entries for N cells filled.
  -- If the array is empty or too short, the player filled < MIN_CELLS_FILLED cells manually.
  -- (We allow this to pass for game-over submissions where the player never finished.)
  cells_filled := COALESCE(array_length(p_cell_intervals, 1), 0) + 1;
  IF p_solved AND cells_filled < MIN_CELLS_FILLED THEN
    RETURN;
  END IF;

  -- ── Guard 3: Inter-cell timing honeypot ──────────────────
  -- Only applies when we have enough intervals to analyze.
  IF array_length(p_cell_intervals, 1) >= 10 THEN
    manual_intervals := collapse_fast_fill_bursts(p_cell_intervals, 80);
    IF array_length(manual_intervals, 1) >= 5 THEN
      median_interval := array_median(manual_intervals);
      IF median_interval IS NOT NULL AND median_interval < MIN_MEDIAN_MS THEN
        RETURN;
      END IF;
    END IF;
  END IF;

  -- ── All guards passed: record the completion ──────────────

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
