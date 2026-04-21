-- ============================================================
-- Daily Sudoku — link_anonymous_player: preserve authed completions
--
-- Fix: previously, merging an anon player into an existing authed
-- player on sign-in would overwrite the authed player's completion
-- for a given puzzle if the anon player had a faster solve (via
-- ON CONFLICT DO UPDATE SET elapsed_seconds = LEAST(...)).
--
-- New rule: if the authed player already has a completion for that
-- puzzle_number, keep it untouched. Only carry over anon completions
-- for puzzles the authed player has never completed.
--
-- Streaks / last_completed_date still merge via GREATEST, since
-- those are monotonic and don't destroy prior state.
-- ============================================================

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
      -- Move completions: anon → canonical. If the canonical player
      -- already has a completion for that puzzle, keep it untouched
      -- (authed wins — never overwrite an existing solve).
      INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at)
      SELECT canonical_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at
      FROM completions
      WHERE player_id = anon_row.id
      ON CONFLICT (player_id, puzzle_number) DO NOTHING;

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

GRANT EXECUTE ON FUNCTION link_anonymous_player(UUID) TO authenticated;
