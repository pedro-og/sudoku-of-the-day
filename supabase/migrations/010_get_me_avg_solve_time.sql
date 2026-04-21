-- ============================================================
-- Daily Sudoku — Add avg_solve_time_seconds to get_me()
-- ============================================================

CREATE OR REPLACE FUNCTION get_me()
RETURNS JSON AS $$
DECLARE
  uid UUID := auth.uid();
  result_row players%ROWTYPE;
  avg_time NUMERIC;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT * INTO result_row FROM players WHERE auth_user_id = uid;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT ROUND(AVG(elapsed_seconds)) INTO avg_time
  FROM completions
  WHERE player_id = result_row.id AND solved = TRUE;

  RETURN json_build_object(
    'id', result_row.id,
    'username', result_row.username,
    'current_streak', result_row.current_streak,
    'longest_streak', result_row.longest_streak,
    'last_completed_date', result_row.last_completed_date,
    'preferences', result_row.preferences,
    'auth_user_id', result_row.auth_user_id,  
    'avg_solve_time_seconds', avg_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_me() TO authenticated;
