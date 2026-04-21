-- ============================================================
-- Daily Sudoku — get_my_completion(puzzle_number)
--
-- Returns the current authenticated user's completion for a given
-- puzzle so the client can restore a completed view after login
-- from another device.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_completion(p_puzzle_number BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  player_row players%ROWTYPE;
  completion_row completions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO player_row FROM players WHERE auth_user_id = uid;
  IF player_row.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO completion_row
  FROM completions
  WHERE player_id = player_row.id AND puzzle_number = p_puzzle_number
  ORDER BY solved DESC, elapsed_seconds ASC
  LIMIT 1;

  IF completion_row.player_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'puzzle_number', completion_row.puzzle_number,
    'elapsed_seconds', completion_row.elapsed_seconds,
    'mistakes', completion_row.mistakes,
    'solved', completion_row.solved
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_completion(BIGINT) TO authenticated;
