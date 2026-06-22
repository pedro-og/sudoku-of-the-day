-- ============================================================
-- Daily Sudoku — Participation Streak (🔥) + Perfect Streak (🔵)
--
-- Business-rule change:
--   - 🔥 current_streak now counts PARTICIPATION: it advances whenever the
--     player finishes the day's puzzle, win OR loss (game over by 3 mistakes).
--     A player who tried hard and lost no longer loses their streak.
--   - 🔵 perfect_streak is a NEW counter: consecutive UNBEATEN wins.
--     It advances only on a solve, resets to 0 on a loss, and — like the
--     normal streak — a purchased freeze can still bridge a skipped day.
--     Shown on the results screen only.
--
-- New columns on players:
--   - perfect_streak          INT  → current unbeaten win streak (🔵)
--   - longest_perfect_streak  INT  → best ever 🔵
--   - last_played_date        DATE → last day the player *played* (win or loss),
--                                    drives the participation streak (🔥).
--   (last_completed_date keeps its meaning: last *solved* day, drives 🔵 + perfect-week.)
--
-- Run AFTER migrations 001–014.
--
-- ⚠️  Streak semantics below MUST stay in sync with
--     src/features/daily/lib/streakTracker.ts (anonymous/localStorage path).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Schema changes
-- ------------------------------------------------------------
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS perfect_streak         INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_perfect_streak INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_played_date       DATE;

-- Backfill: until now the streak was computed from solves only, so every
-- existing player's current_streak *is* their unbeaten (perfect) streak.
-- Seed 🔵 from it for ALL players so the transition is fair, and align
-- last_played_date with the last known completion (the only day that counted
-- as "played" under the old rules).
--
-- Guarded by a one-shot marker so re-running this migration can't clobber
-- perfect streaks that have since diverged from current_streak under the new
-- rules (a player who lost keeps a high 🔥 but a reset 🔵).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'migration_015_seeded'
  ) THEN
    UPDATE players
    SET perfect_streak = current_streak,
        longest_perfect_streak = GREATEST(longest_perfect_streak, longest_streak),
        last_played_date = COALESCE(last_played_date, last_completed_date);
    CREATE TABLE migration_015_seeded ();
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. record_completion — participation streak (🔥) + perfect streak (🔵)
--    Replaces the migration 014 signature; still RETURNS JSON.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS record_completion(UUID, INT, INT, INT, BOOLEAN, DATE, INT[]);

CREATE OR REPLACE FUNCTION record_completion(
  p_player_id UUID,
  p_puzzle_number INT,
  p_elapsed_seconds INT,
  p_mistakes INT,
  p_solved BOOLEAN,
  p_puzzle_date DATE,
  p_cell_intervals INT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  cells_filled INT;
  MIN_ELAPSED_SECONDS CONSTANT INT := 30;
  MIN_CELLS_FILLED    CONSTANT INT := 15;
  prev players%ROWTYPE;
  gap INT;
  new_streak INT;            -- 🔥 participation streak
  new_perfect INT;          -- 🔵 perfect (unbeaten) streak
  freeze_consumed BOOLEAN := false;
  week_start DATE;
  perfect_week BOOLEAN := false;
  days_covered INT;
  breakdown JSON;
  awarded INT := 0;
  new_balance INT;
BEGIN
  -- Guard 1: hard time floor
  IF p_elapsed_seconds < MIN_ELAPSED_SECONDS THEN
    RETURN NULL;
  END IF;

  -- Guard 2: cell-count floor (solved only)
  IF p_solved THEN
    cells_filled := COALESCE(array_length(p_cell_intervals, 1), 0) + 1;
    IF cells_filled < MIN_CELLS_FILLED THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO players (id) VALUES (p_player_id) ON CONFLICT (id) DO NOTHING;
  SELECT * INTO prev FROM players WHERE id = p_player_id;

  INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved)
  VALUES (p_player_id, p_puzzle_number, p_elapsed_seconds, p_mistakes, p_solved)
  ON CONFLICT (player_id, puzzle_number) DO NOTHING;

  -- ---- 🔥 Participation streak (advances on win OR loss) ----
  -- Driven by last_played_date so a game-over still keeps the chain alive.
  IF prev.last_played_date IS NULL THEN
    new_streak := 1;
  ELSIF prev.last_played_date = p_puzzle_date THEN
    new_streak := prev.current_streak;            -- already counted today
  ELSE
    gap := p_puzzle_date - prev.last_played_date;
    IF gap = 1 THEN
      new_streak := prev.current_streak + 1;
    ELSE
      new_streak := 1;                            -- a fully-skipped day breaks 🔥
    END IF;
  END IF;

  -- ---- 🔵 Perfect streak (unbeaten wins; freeze bridges a skipped day) ----
  IF NOT p_solved THEN
    new_perfect := 0;                             -- a loss resets the perfect chain
  ELSIF prev.last_completed_date IS NULL THEN
    new_perfect := 1;
  ELSIF prev.last_completed_date = p_puzzle_date THEN
    new_perfect := prev.perfect_streak;           -- already counted today
  ELSE
    gap := p_puzzle_date - prev.last_completed_date;
    IF gap = 1 THEN
      new_perfect := prev.perfect_streak + 1;
    ELSIF gap > 1 AND prev.streak_freezes > 0 THEN
      -- Auto-consume one freeze per missed day, up to what we own.
      DECLARE
        missed INT := gap - 1;
        usable INT;
        d DATE;
      BEGIN
        usable := LEAST(missed, prev.streak_freezes);
        FOR i IN 1..usable LOOP
          d := prev.last_completed_date + i;
          INSERT INTO streak_freezes_used (player_id, used_date)
          VALUES (p_player_id, d) ON CONFLICT DO NOTHING;
        END LOOP;
        UPDATE players SET streak_freezes = streak_freezes - usable WHERE id = p_player_id;
        IF usable = missed THEN
          new_perfect := prev.perfect_streak + 1; -- fully bridged
          freeze_consumed := true;
        ELSE
          new_perfect := 1;                        -- not enough freezes
        END IF;
      END;
    ELSE
      new_perfect := 1;
    END IF;
  END IF;

  -- ---- Persist participation streak + last_played_date (always) ----
  UPDATE players
  SET current_streak = new_streak,
      longest_streak = GREATEST(longest_streak, new_streak),
      last_played_date = CASE WHEN last_played_date = p_puzzle_date
                              THEN last_played_date ELSE p_puzzle_date END
  WHERE id = p_player_id;

  -- ---- Loss path: persist perfect-streak reset, skip coins/stats ----
  IF NOT p_solved THEN
    UPDATE players SET perfect_streak = new_perfect WHERE id = p_player_id;
    SELECT * INTO prev FROM players WHERE id = p_player_id;
    RETURN json_build_object(
      'breakdown', NULL,
      'new_balance', prev.sudokoins,
      'streak', new_streak,
      'perfect_streak', new_perfect,
      'longest_perfect_streak', prev.longest_perfect_streak
    );
  END IF;

  -- ---- Perfect week: all elapsed days of the current week done/frozen ----
  week_start := p_puzzle_date - (EXTRACT(ISODOW FROM p_puzzle_date)::INT - 1);
  SELECT COUNT(DISTINCT d) INTO days_covered
  FROM (
    SELECT c.completed_at::date AS d
    FROM completions c
    WHERE c.player_id = p_player_id AND c.solved
      AND c.completed_at::date BETWEEN week_start AND p_puzzle_date
    UNION
    SELECT used_date FROM streak_freezes_used
    WHERE player_id = p_player_id AND used_date BETWEEN week_start AND p_puzzle_date
    UNION
    SELECT p_puzzle_date  -- the completion we are recording right now
  ) days;
  perfect_week := days_covered >= (p_puzzle_date - week_start + 1);

  -- ---- Persist solved-day fields: last_completed_date + perfect streak ----
  UPDATE players
  SET last_completed_date = CASE WHEN last_completed_date = p_puzzle_date
                                 THEN last_completed_date ELSE p_puzzle_date END,
      perfect_streak = new_perfect,
      longest_perfect_streak = GREATEST(longest_perfect_streak, new_perfect)
  WHERE id = p_player_id;

  -- ---- Aggregate stats (unchanged) ----
  INSERT INTO daily_stats (puzzle_number, players_started, players_solved, total_completion_time)
  VALUES (p_puzzle_number, 0, 1, p_elapsed_seconds)
  ON CONFLICT (puzzle_number) DO UPDATE SET
    players_solved = daily_stats.players_solved + 1,
    total_completion_time = daily_stats.total_completion_time + p_elapsed_seconds;

  -- ---- Coins (idempotent via coin_ledger UNIQUE) ----
  -- Milestone bonuses keyed off the 🔥 participation streak (rewards showing up
  -- regardless of wins/losses, matching the new business rule).
  breakdown := calc_reward_breakdown(p_elapsed_seconds, p_mistakes, new_streak, perfect_week);

  INSERT INTO coin_ledger (player_id, puzzle_number, reason, amount)
  VALUES (p_player_id, p_puzzle_number, 'daily', (breakdown->>'total')::INT)
  ON CONFLICT (player_id, puzzle_number, reason) DO NOTHING;

  IF FOUND THEN
    awarded := (breakdown->>'total')::INT;
  END IF;

  UPDATE players SET sudokoins = sudokoins + awarded WHERE id = p_player_id
  RETURNING sudokoins INTO new_balance;

  RETURN json_build_object(
    'breakdown', breakdown,
    'new_balance', new_balance,
    'streak', new_streak,
    'perfect_streak', new_perfect,
    'longest_perfect_streak', GREATEST(prev.longest_perfect_streak, new_perfect),
    'freeze_consumed', freeze_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 3. Extend get_me() with perfect-streak fields
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_me()
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
  r players%ROWTYPE;
  avg_time NUMERIC;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO r FROM players WHERE auth_user_id = uid;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT AVG(elapsed_seconds) INTO avg_time
  FROM completions WHERE player_id = r.id AND solved;

  RETURN json_build_object(
    'id', r.id, 'username', r.username,
    'current_streak', r.current_streak, 'longest_streak', r.longest_streak,
    'perfect_streak', r.perfect_streak, 'longest_perfect_streak', r.longest_perfect_streak,
    'last_completed_date', r.last_completed_date,
    'preferences', r.preferences, 'auth_user_id', r.auth_user_id,
    'avg_solve_time_seconds', CASE WHEN avg_time IS NULL THEN NULL ELSE ROUND(avg_time) END,
    'sudokoins', r.sudokoins, 'streak_freezes', r.streak_freezes, 'undo_tokens', r.undo_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4. Extend link_anonymous_player(): merge perfect-streak fields
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION link_anonymous_player(p_anon_id UUID)
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
  existing_authed players%ROWTYPE;
  anon_row players%ROWTYPE;
  canonical_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO existing_authed FROM players WHERE auth_user_id = uid;
  IF p_anon_id IS NOT NULL THEN
    SELECT * INTO anon_row FROM players WHERE id = p_anon_id;
  END IF;

  IF existing_authed.id IS NOT NULL THEN
    canonical_id := existing_authed.id;

    IF anon_row.id IS NOT NULL AND anon_row.id <> canonical_id AND anon_row.auth_user_id IS NULL THEN
      INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at)
      SELECT canonical_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at
      FROM completions WHERE player_id = anon_row.id
      ON CONFLICT (player_id, puzzle_number) DO UPDATE
        SET elapsed_seconds = LEAST(completions.elapsed_seconds, EXCLUDED.elapsed_seconds),
            mistakes = CASE WHEN EXCLUDED.elapsed_seconds < completions.elapsed_seconds
                            THEN EXCLUDED.mistakes ELSE completions.mistakes END,
            solved = completions.solved OR EXCLUDED.solved;
      DELETE FROM completions WHERE player_id = anon_row.id;

      -- Move coin ledger so the merged account keeps idempotency keys.
      INSERT INTO coin_ledger (player_id, puzzle_number, reason, amount, created_at)
      SELECT canonical_id, puzzle_number, reason, amount, created_at
      FROM coin_ledger WHERE player_id = anon_row.id
      ON CONFLICT (player_id, puzzle_number, reason) DO NOTHING;
      DELETE FROM coin_ledger WHERE player_id = anon_row.id;

      INSERT INTO streak_freezes_used (player_id, used_date)
      SELECT canonical_id, used_date FROM streak_freezes_used WHERE player_id = anon_row.id
      ON CONFLICT DO NOTHING;
      DELETE FROM streak_freezes_used WHERE player_id = anon_row.id;

      UPDATE players
      SET current_streak = GREATEST(current_streak, anon_row.current_streak),
          longest_streak = GREATEST(longest_streak, anon_row.longest_streak),
          perfect_streak = GREATEST(perfect_streak, anon_row.perfect_streak),
          longest_perfect_streak = GREATEST(longest_perfect_streak, anon_row.longest_perfect_streak),
          last_completed_date = GREATEST(
            COALESCE(last_completed_date, DATE '1900-01-01'),
            COALESCE(anon_row.last_completed_date, DATE '1900-01-01')),
          last_played_date = GREATEST(
            COALESCE(last_played_date, DATE '1900-01-01'),
            COALESCE(anon_row.last_played_date, DATE '1900-01-01')),
          sudokoins = sudokoins + anon_row.sudokoins,
          streak_freezes = LEAST(2, streak_freezes + anon_row.streak_freezes),
          undo_tokens = undo_tokens + anon_row.undo_tokens
      WHERE id = canonical_id;

      DELETE FROM players WHERE id = anon_row.id;
    END IF;

  ELSIF anon_row.id IS NOT NULL AND anon_row.auth_user_id IS NULL THEN
    UPDATE players SET auth_user_id = uid WHERE id = anon_row.id;
    canonical_id := anon_row.id;

  ELSE
    INSERT INTO players (id, username, auth_user_id)
    VALUES (gen_random_uuid(), generate_unique_username(), uid)
    RETURNING id INTO canonical_id;
  END IF;

  RETURN (SELECT json_build_object(
    'id', id, 'username', username,
    'current_streak', current_streak, 'longest_streak', longest_streak,
    'perfect_streak', perfect_streak, 'longest_perfect_streak', longest_perfect_streak,
    'last_completed_date', last_completed_date,
    'preferences', preferences, 'auth_user_id', auth_user_id,
    'sudokoins', sudokoins, 'streak_freezes', streak_freezes, 'undo_tokens', undo_tokens
  ) FROM players WHERE id = canonical_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 5. Grants
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION record_completion(UUID, INT, INT, INT, BOOLEAN, DATE, INT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_me() TO authenticated;
GRANT EXECUTE ON FUNCTION link_anonymous_player(UUID) TO authenticated;
