CREATE OR REPLACE FUNCTION public.submit_scribble_guess(
  p_lobby_id uuid,
  p_guess text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_word text;
  v_is_correct boolean;
  v_username text;
  v_current_score integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Get current word
  SELECT current_word INTO v_word
  FROM scribble_lobbies
  WHERE id = p_lobby_id;

  IF v_word IS NULL THEN
    v_is_correct := false;
  ELSE
    v_is_correct := lower(trim(p_guess)) = lower(trim(v_word));
  END IF;

  -- Get username and score
  SELECT username, score INTO v_username, v_current_score
  FROM scribble_players
  WHERE lobby_id = p_lobby_id AND user_id = v_user_id;

  IF v_username IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_in_lobby');
  END IF;

  -- Insert guess
  INSERT INTO scribble_guesses (lobby_id, user_id, username, guess, is_correct)
  VALUES (p_lobby_id, v_user_id, v_username, p_guess, v_is_correct);

  -- Award points if correct
  IF v_is_correct THEN
    UPDATE scribble_players
    SET score = COALESCE(v_current_score, 0) + 10
    WHERE lobby_id = p_lobby_id AND user_id = v_user_id;
  END IF;

  RETURN json_build_object('success', true, 'is_correct', v_is_correct);
END;
$$;