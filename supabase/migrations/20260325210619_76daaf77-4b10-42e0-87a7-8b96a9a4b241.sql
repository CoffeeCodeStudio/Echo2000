
CREATE OR REPLACE FUNCTION public.give_good_vibe(p_target_type text, p_target_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv', 'klotter') THEN
    RETURN json_build_object('success', false, 'error', 'invalid_target_type');
  END IF;
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_target_id');
  END IF;
  IF EXISTS (
    SELECT 1 FROM good_vibes 
    WHERE giver_id = v_user_id 
      AND target_type = p_target_type 
      AND target_id = p_target_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'already_vibed');
  END IF;
  INSERT INTO good_vibes (giver_id, target_type, target_id)
  VALUES (v_user_id, p_target_type, p_target_id);
  RETURN json_build_object('success', true, 'vibes_remaining', -1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_good_vibes(p_target_type text, p_target_id text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv', 'klotter') THEN
    RETURN 0;
  END IF;
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN 0;
  END IF;
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM good_vibes
    WHERE target_type = p_target_type AND target_id = p_target_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_user_vibed(p_target_type text, p_target_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_target_type NOT IN ('guestbook', 'post', 'message', 'profile', 'lajv', 'klotter') THEN
    RETURN false;
  END IF;
  IF p_target_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM good_vibes 
    WHERE giver_id = auth.uid() 
      AND target_type = p_target_type 
      AND target_id = p_target_id
  );
END;
$function$;
