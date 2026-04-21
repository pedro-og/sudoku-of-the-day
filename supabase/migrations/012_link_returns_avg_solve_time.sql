-- ============================================================
-- Daily Sudoku — link_anonymous_player: include avg_solve_time_seconds
--
-- Migration 011 rewrote link_anonymous_player and dropped the
-- avg_solve_time_seconds field from the returned JSON, so the
-- SideMenu lost the "average time" card for users whose profile
-- came back through the link path (i.e. every fresh session).
--
-- Align the return shape with get_me() (migration 010).
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

  IF existing_authed.id IS NOT NULL THEN
    canonical_id := existing_authed.id;

    IF anon_row.id IS NOT NULL AND anon_row.id <> canonical_id AND anon_row.auth_user_id IS NULL THEN
      INSERT INTO completions (player_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at)
      SELECT canonical_id, puzzle_number, elapsed_seconds, mistakes, solved, completed_at
      FROM completions
      WHERE player_id = anon_row.id
      ON CONFLICT (player_id, puzzle_number) DO NOTHING;

      DELETE FROM completions WHERE player_id = anon_row.id;

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

  ELSIF anon_row.id IS NOT NULL AND anon_row.auth_user_id IS NULL THEN
    UPDATE players SET auth_user_id = uid WHERE id = anon_row.id;
    canonical_id := anon_row.id;

  ELSE
    INSERT INTO players (id, username, auth_user_id)
    VALUES (gen_random_uuid(), generate_unique_username(), uid)
    RETURNING id INTO canonical_id;
  END IF;

  RETURN (
    SELECT json_build_object(
      'id', p.id,
      'username', p.username,
      'current_streak', p.current_streak,
      'longest_streak', p.longest_streak,
      'last_completed_date', p.last_completed_date,
      'preferences', p.preferences,
      'auth_user_id', p.auth_user_id,
      'avg_solve_time_seconds', (
        SELECT ROUND(AVG(elapsed_seconds))
        FROM completions
        WHERE player_id = p.id AND solved = TRUE
      )
    )
    FROM players p WHERE p.id = canonical_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_anonymous_player(UUID) TO authenticated;
