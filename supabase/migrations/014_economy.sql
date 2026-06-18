-- ============================================================
-- Daily Sudoku — Sudokoins Economy, Shop & Automatic Streak Freeze
--
-- Adds:
--   - sudokoins / streak_freezes / undo_tokens columns on players
--   - coin_ledger (idempotent audit trail of every coin award)
--   - streak_freezes_used (which dates a freeze was auto-consumed,
--     so the client can render 🧊 in the weekly calendar)
--   - record_completion() extended: computes the reward breakdown
--     server-side (mirrors src/features/economy/lib/coinEconomy.ts),
--     auto-consumes a freeze when a day is skipped, and RETURNS JSON
--     { breakdown, new_balance, streak } instead of void.
--   - purchase_item(), consume_undo_token()
--   - get_me() / link_anonymous_player() extended with wallet fields
--   - get_week_calendar() for the Mon→Sun strip
--
-- Run AFTER migrations 001–013.
--
-- ⚠️  Economy constants below MUST stay in sync with
--     src/features/economy/lib/coinEconomy.ts (COIN_ECONOMY / SHOP_ITEMS).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Schema changes
-- ------------------------------------------------------------
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS sudokoins     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freezes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS undo_tokens   INT NOT NULL DEFAULT 0;

-- Idempotent audit trail. UNIQUE(player, puzzle, reason) prevents
-- double-crediting on reload / retried RPC calls.
CREATE TABLE IF NOT EXISTS coin_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  puzzle_number INT NOT NULL,
  reason TEXT NOT NULL,
  amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_id, puzzle_number, reason)
);

-- Dates on which an automatic streak freeze was consumed.
CREATE TABLE IF NOT EXISTS streak_freezes_used (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  used_date DATE NOT NULL,
  PRIMARY KEY (player_id, used_date)
);

ALTER TABLE coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_freezes_used ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. Pure reward calculator (mirrors coinEconomy.ts)
--    Returns the line-by-line breakdown as JSON.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calc_reward_breakdown(
  p_elapsed_seconds INT,
  p_mistakes INT,
  p_streak INT,
  p_perfect_week BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  c_base CONSTANT INT := 20;
  c_speed_max CONSTANT INT := 15;
  c_target CONSTANT INT := 480;
  c_perfect CONSTANT INT := 10;
  c_almost CONSTANT INT := 4;
  c_ms5 CONSTANT INT := 5;
  c_ms10 CONSTANT INT := 15;
  c_week CONSTANT INT := 7;
  speed INT;
  lines JSON[] := ARRAY[]::JSON[];
BEGIN
  lines := lines || json_build_object('key', 'challengeComplete', 'amount', c_base);

  speed := GREATEST(0, LEAST(c_speed_max,
    ROUND((c_speed_max::NUMERIC * (c_target - p_elapsed_seconds)) / c_target)::INT));
  IF speed > 0 THEN
    lines := lines || json_build_object('key', 'speedBonus', 'amount', speed);
  END IF;

  IF p_mistakes = 0 THEN
    lines := lines || json_build_object('key', 'perfect', 'amount', c_perfect);
  ELSIF p_mistakes = 1 THEN
    lines := lines || json_build_object('key', 'almostPerfect', 'amount', c_almost);
  END IF;

  IF p_streak > 0 AND p_streak % 10 = 0 THEN
    lines := lines || json_build_object('key', 'streakMilestone10', 'amount', c_ms10, 'meta', json_build_object('streak', p_streak));
  ELSIF p_streak > 0 AND p_streak % 5 = 0 THEN
    lines := lines || json_build_object('key', 'streakMilestone5', 'amount', c_ms5, 'meta', json_build_object('streak', p_streak));
  END IF;

  IF p_perfect_week THEN
    lines := lines || json_build_object('key', 'perfectWeek', 'amount', c_week);
  END IF;

  RETURN json_build_object(
    'lines', array_to_json(lines),
    'total', (SELECT COALESCE(SUM((l->>'amount')::INT), 0) FROM unnest(lines) AS l)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ------------------------------------------------------------
-- 3. record_completion — extended with economy + auto-freeze
--    Replaces the migration 007 signature; now RETURNS JSON.
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
  new_streak INT;
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

  IF NOT p_solved THEN
    RETURN json_build_object('breakdown', NULL, 'new_balance', prev.sudokoins, 'streak', prev.current_streak);
  END IF;

  -- ---- Streak with automatic freeze ----
  IF prev.last_completed_date IS NULL THEN
    new_streak := 1;
  ELSIF prev.last_completed_date = p_puzzle_date THEN
    new_streak := prev.current_streak;            -- already counted today
  ELSE
    gap := p_puzzle_date - prev.last_completed_date;
    IF gap = 1 THEN
      new_streak := prev.current_streak + 1;
    ELSIF gap > 1 AND prev.streak_freezes > 0 THEN
      -- Auto-consume one freeze per missed day, up to what we own.
      -- Each frozen day keeps the chain alive.
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
          new_streak := prev.current_streak + 1;  -- fully bridged
          freeze_consumed := true;
        ELSE
          new_streak := 1;                         -- not enough freezes
        END IF;
      END;
    ELSE
      new_streak := 1;
    END IF;
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

  -- ---- Persist streak ----
  UPDATE players
  SET current_streak = new_streak,
      longest_streak = GREATEST(longest_streak, new_streak),
      last_completed_date = CASE WHEN last_completed_date = p_puzzle_date
                                 THEN last_completed_date ELSE p_puzzle_date END
  WHERE id = p_player_id;

  -- ---- Aggregate stats (unchanged) ----
  INSERT INTO daily_stats (puzzle_number, players_started, players_solved, total_completion_time)
  VALUES (p_puzzle_number, 0, 1, p_elapsed_seconds)
  ON CONFLICT (puzzle_number) DO UPDATE SET
    players_solved = daily_stats.players_solved + 1,
    total_completion_time = daily_stats.total_completion_time + p_elapsed_seconds;

  -- ---- Coins (idempotent via coin_ledger UNIQUE) ----
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
    'freeze_consumed', freeze_consumed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4. Shop: purchase_item / consume_undo_token
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION purchase_item(p_player_id UUID, p_item TEXT)
RETURNS JSON AS $$
DECLARE
  PRICE_FREEZE CONSTANT INT := 120;
  PRICE_UNDO   CONSTANT INT := 50;
  MAX_FREEZE   CONSTANT INT := 2;
  pl players%ROWTYPE;
  price INT;
BEGIN
  SELECT * INTO pl FROM players WHERE id = p_player_id;
  IF pl.id IS NULL THEN RAISE EXCEPTION 'unknown player'; END IF;

  IF p_item = 'streakFreeze' THEN
    price := PRICE_FREEZE;
    IF pl.streak_freezes >= MAX_FREEZE THEN
      RETURN json_build_object('ok', false, 'error', 'maxOwned');
    END IF;
  ELSIF p_item = 'undoToken' THEN
    price := PRICE_UNDO;
  ELSE
    RAISE EXCEPTION 'unknown item %', p_item;
  END IF;

  IF pl.sudokoins < price THEN
    RETURN json_build_object('ok', false, 'error', 'insufficient');
  END IF;

  UPDATE players SET
    sudokoins = sudokoins - price,
    streak_freezes = streak_freezes + (CASE WHEN p_item = 'streakFreeze' THEN 1 ELSE 0 END),
    undo_tokens   = undo_tokens   + (CASE WHEN p_item = 'undoToken'   THEN 1 ELSE 0 END)
  WHERE id = p_player_id
  RETURNING * INTO pl;

  RETURN json_build_object(
    'ok', true,
    'sudokoins', pl.sudokoins,
    'streak_freezes', pl.streak_freezes,
    'undo_tokens', pl.undo_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION consume_undo_token(p_player_id UUID)
RETURNS JSON AS $$
DECLARE pl players%ROWTYPE;
BEGIN
  UPDATE players SET undo_tokens = undo_tokens - 1
  WHERE id = p_player_id AND undo_tokens > 0
  RETURNING * INTO pl;
  IF pl.id IS NULL THEN RETURN json_build_object('ok', false); END IF;
  RETURN json_build_object('ok', true, 'undo_tokens', pl.undo_tokens);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 5. get_week_calendar — Mon→Sun statuses for the current week
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_week_calendar(p_player_id UUID, p_today DATE)
RETURNS JSON AS $$
DECLARE
  week_start DATE := p_today - (EXTRACT(ISODOW FROM p_today)::INT - 1);
  completed DATE[];
  frozen DATE[];
BEGIN
  SELECT array_agg(DISTINCT completed_at::date) INTO completed
  FROM completions
  WHERE player_id = p_player_id AND solved
    AND completed_at::date BETWEEN week_start AND week_start + 6;

  SELECT array_agg(used_date) INTO frozen
  FROM streak_freezes_used
  WHERE player_id = p_player_id AND used_date BETWEEN week_start AND week_start + 6;

  RETURN json_build_object(
    'week_start', week_start,
    'completed', COALESCE(to_json(completed), '[]'::json),
    'frozen', COALESCE(to_json(frozen), '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 6. Extend get_me() with wallet fields
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
    'last_completed_date', r.last_completed_date,
    'preferences', r.preferences, 'auth_user_id', r.auth_user_id,
    'avg_solve_time_seconds', CASE WHEN avg_time IS NULL THEN NULL ELSE ROUND(avg_time) END,
    'sudokoins', r.sudokoins, 'streak_freezes', r.streak_freezes, 'undo_tokens', r.undo_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 7. Extend link_anonymous_player(): merge wallet on sign-in
--    Sum coins, sum undo tokens, cap freezes at 2.
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
          last_completed_date = GREATEST(
            COALESCE(last_completed_date, DATE '1900-01-01'),
            COALESCE(anon_row.last_completed_date, DATE '1900-01-01')),
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
    'last_completed_date', last_completed_date,
    'preferences', preferences, 'auth_user_id', auth_user_id,
    'sudokoins', sudokoins, 'streak_freezes', streak_freezes, 'undo_tokens', undo_tokens
  ) FROM players WHERE id = canonical_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 8. Grants
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION record_completion(UUID, INT, INT, INT, BOOLEAN, DATE, INT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION purchase_item(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_undo_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_week_calendar(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_me() TO authenticated;
GRANT EXECUTE ON FUNCTION link_anonymous_player(UUID) TO authenticated;
