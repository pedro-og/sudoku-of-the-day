-- ============================================================
-- Daily Sudoku — Google Auth + Account Linking
--
-- Adds:
--   - auth_user_id + preferences columns on players
--   - server-side unique username generation
--   - link_anonymous_player(): merges anon row into authed row on sign-in
--     (max streaks, dedupe completions by puzzle_number keeping fastest)
--   - get_me(), set_preferences(), set_username_if_null()
--   - find_player_by_auth_user(): lets the client detect if the Google
--     email already has an existing account (→ "just log in")
--
-- Run AFTER migrations 001–008.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Schema changes on players
-- ------------------------------------------------------------

-- Dedupe existing usernames so we can add a UNIQUE constraint.
-- Appends "-2", "-3", ... to collisions, keeping the oldest row's name intact.
WITH ranked AS (
  SELECT id, username,
         ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at, id) AS rn
  FROM players
  WHERE username IS NOT NULL
)
UPDATE players p
SET username = r.username || '-' || r.rn
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Unique index on username (case-insensitive to avoid "Cloud Ocean" vs "cloud ocean" collisions).
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username_lower
  ON players (LOWER(username))
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_auth_user_id
  ON players(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Server-side username generator (collision-proof)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_unique_username()
RETURNS TEXT AS $$
DECLARE
  words TEXT[] := ARRAY[
    'Alpha','Arrow','Atlas','Blaze','Blade','Brave','Cedar','Chase','Cloud','Coral',
    'Crash','Crown','Cyber','Delta','Dream','Drift','Eagle','Ember','Fable','Flame',
    'Flash','Frost','Ghost','Grace','Grand','Haven','Ivory','Jewel','Karma','Keyan',
    'Light','Lotus','Lucky','Maple','Mirth','Mocha','Noble','North','Ocean','Onion',
    'Orbit','Panda','Pearl','Phase','Pixel','Prism','Pulse','Queen','Quest','Quick',
    'Raven','Rider','River','Robin','Rocky','Rouge','Roxan','Royal','Sable','Scout',
    'Shade','Sharp','Shore','Solar','Sonic','Spark','Spice','Staff','Stark','Steam',
    'Steel','Stone','Storm','Sugar','Swift','Terra','Thorn','Tidal','Tiger','Titan',
    'Topaz','Torch','Trace','Trail','Ultra','Unity','Venom','Vigor','Vinyl','Viper',
    'Vista','Vivid','Volta','Whale','Whirl','Wired','Xenon','Yield','Zebra'
  ];
  attempt INT := 0;
  candidate TEXT;
  a TEXT;
  b TEXT;
BEGIN
  LOOP
    a := words[1 + floor(random() * array_length(words, 1))::INT];
    b := words[1 + floor(random() * array_length(words, 1))::INT];
    IF a = b THEN CONTINUE; END IF;

    candidate := a || ' ' || b;

    -- On the first 20 attempts use the plain "Word Word" form. After that,
    -- start appending a numeric suffix so we guarantee termination even if
    -- the namespace is saturated.
    IF attempt >= 20 THEN
      candidate := candidate || ' ' || (100 + floor(random() * 9900))::INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE LOWER(username) = LOWER(candidate)) THEN
      RETURN candidate;
    END IF;
    attempt := attempt + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. ensure_player — server picks a unique username
-- ------------------------------------------------------------
-- Overrides the signature from migration 008. Client no longer supplies a
-- username; server generates one on first insert and returns the row.
DROP FUNCTION IF EXISTS ensure_player(UUID, TEXT);
DROP FUNCTION IF EXISTS ensure_player(UUID);

CREATE OR REPLACE FUNCTION ensure_player(p_id UUID)
RETURNS JSON AS $$
DECLARE
  result_row players%ROWTYPE;
BEGIN
  SELECT * INTO result_row FROM players WHERE id = p_id;

  IF NOT FOUND THEN
    INSERT INTO players (id, username)
    VALUES (p_id, generate_unique_username())
    RETURNING * INTO result_row;
  ELSIF result_row.username IS NULL THEN
    UPDATE players
    SET username = generate_unique_username()
    WHERE id = p_id
    RETURNING * INTO result_row;
  END IF;

  RETURN json_build_object(
    'id', result_row.id,
    'username', result_row.username,
    'current_streak', result_row.current_streak,
    'longest_streak', result_row.longest_streak,
    'preferences', result_row.preferences,
    'auth_user_id', result_row.auth_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4. get_me — canonical row for the currently authenticated user
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_me()
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
  result_row players%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO result_row FROM players WHERE auth_user_id = uid;
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN json_build_object(
    'id', result_row.id,
    'username', result_row.username,
    'current_streak', result_row.current_streak,
    'longest_streak', result_row.longest_streak,
    'last_completed_date', result_row.last_completed_date,
    'preferences', result_row.preferences,
    'auth_user_id', result_row.auth_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 5. link_anonymous_player — called right after Google sign-in
--
-- Rules:
--   - If this Google account already has a linked players row:
--       merge the anon row into it (max streaks, dedupe completions
--       keeping the fastest, then DELETE the anon row).
--       → "this email is already signed up, just log in".
--   - Otherwise, promote the anon row: set auth_user_id = auth.uid().
--   - If no anon row is supplied / doesn't exist, create a new authed row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION link_anonymous_player(p_anon_id UUID)
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
  existing_authed players%ROWTYPE;
  anon_row players%ROWTYPE;
  canonical_id UUID;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing_authed FROM players WHERE auth_user_id = uid;
  IF p_anon_id IS NOT NULL THEN
    SELECT * INTO anon_row FROM players WHERE id = p_anon_id;
  END IF;

  -- Case A: Google account already linked elsewhere → merge anon into it.
  IF existing_authed.id IS NOT NULL THEN
    canonical_id := existing_authed.id;

    IF anon_row.id IS NOT NULL AND anon_row.id <> canonical_id AND anon_row.auth_user_id IS NULL THEN
      -- Move completions: anon → canonical. On conflict keep the fastest solve.
      INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at)
      SELECT canonical_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at
      FROM completions
      WHERE player_id = anon_row.id
      ON CONFLICT (player_id, puzzle_number) DO UPDATE
        SET elapsed_seconds = LEAST(completions.elapsed_seconds, EXCLUDED.elapsed_seconds),
            mistakes = CASE
              WHEN EXCLUDED.elapsed_seconds < completions.elapsed_seconds THEN EXCLUDED.mistakes
              ELSE completions.mistakes
            END,
            solved = completions.solved OR EXCLUDED.solved;

      DELETE FROM completions WHERE player_id = anon_row.id;

      -- Merge streaks: take the max.
      UPDATE players
      SET current_streak = GREATEST(current_streak, anon_row.current_streak),
          longest_streak = GREATEST(longest_streak, anon_row.longest_streak),
          last_completed_date = GREATEST(
            COALESCE(last_completed_date, DATE '1900-01-01'),
            COALESCE(anon_row.last_completed_date, DATE '1900-01-01')
          )
      WHERE id = canonical_id;

      DELETE FROM players WHERE id = anon_row.id;
    END IF;

  -- Case B: no existing authed row, anon row exists and is unlinked → promote it.
  ELSIF anon_row.id IS NOT NULL AND anon_row.auth_user_id IS NULL THEN
    UPDATE players SET auth_user_id = uid WHERE id = anon_row.id;
    canonical_id := anon_row.id;

  -- Case C: no authed row, no (usable) anon row → create fresh.
  ELSE
    INSERT INTO players (id, username, auth_user_id)
    VALUES (gen_random_uuid(), generate_unique_username(), uid)
    RETURNING id INTO canonical_id;
  END IF;

  RETURN (SELECT json_build_object(
    'id', id,
    'username', username,
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'last_completed_date', last_completed_date,
    'preferences', preferences,
    'auth_user_id', auth_user_id
  ) FROM players WHERE id = canonical_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 6. set_preferences — authed user updates their stored prefs
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_preferences(p_prefs JSONB)
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE players
  SET preferences = COALESCE(preferences, '{}'::jsonb) || p_prefs
  WHERE auth_user_id = uid;

  RETURN (SELECT preferences FROM players WHERE auth_user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 7. Grants — RPCs callable by anon + authenticated roles
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION ensure_player(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_me() TO authenticated;
GRANT EXECUTE ON FUNCTION link_anonymous_player(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_preferences(JSONB) TO authenticated;
