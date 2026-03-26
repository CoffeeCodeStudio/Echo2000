CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_botadam_id uuid;
  v_botadam_avatar text;
  v_username text;
  v_join_reason text;
  v_admin_id uuid;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8));
  v_join_reason := COALESCE(NEW.raw_user_meta_data->>'join_reason', '');

  INSERT INTO public.profiles (
    user_id, 
    username,
    join_reason,
    bio, city, gender, occupation, relationship, personality,
    hair_color, body_type, clothing, likes, eats, listens_to,
    prefers, interests, spanar_in, status_message, looking_for
  )
  VALUES (
    NEW.id,
    v_username,
    v_join_reason,
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '{}'::text[]
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT user_id, avatar_url INTO v_botadam_id, v_botadam_avatar
  FROM public.profiles
  WHERE username = 'BotAdam'
  LIMIT 1;

  IF v_botadam_id IS NOT NULL AND v_botadam_id != NEW.id THEN
    INSERT INTO public.friends (user_id, friend_id, status, category)
    VALUES (v_botadam_id, NEW.id, 'accepted', 'Nätvän')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_botadam_id IS NOT NULL THEN
    FOR v_admin_id IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO public.messages (sender_id, recipient_id, subject, content)
      VALUES (
        v_botadam_id,
        v_admin_id,
        '🆕 Ny ansökan: ' || v_username,
        'En ny användare har registrerat sig och väntar på godkännande!' || E'\n\n' ||
        '👤 Namn: ' || v_username || E'\n' ||
        '📧 E-post: ' || COALESCE(NEW.email, 'okänd') || E'\n' ||
        '📝 Motivering: ' || CASE WHEN v_join_reason != '' THEN v_join_reason ELSE '(ingen motivering angiven)' END || E'\n\n' ||
        'Gå till Admin-panelen för att godkänna eller neka ansökan.'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;