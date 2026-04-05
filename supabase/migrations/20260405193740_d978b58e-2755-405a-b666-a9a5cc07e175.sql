CREATE OR REPLACE FUNCTION public.invoke_bot_respond(p_action text, p_bot_user_id uuid, p_target_user_id uuid, p_target_username text, p_context text, p_profile_owner_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_url text;
  v_key text;
  v_bot_id uuid;
  v_body jsonb;
BEGIN
  v_url := 'https://fvmepxriuhmzcraeupjq.supabase.co/functions/v1/bot-respond';

  -- Get service role key from vault (wrapped in exception handler)
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'bot_respond_service_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'invoke_bot_respond: vault access failed: %', SQLERRM;
    RETURN;
  END;

  IF v_key IS NULL THEN
    RAISE WARNING 'bot_respond_service_key not found in vault';
    RETURN;
  END IF;

  -- Get bot_settings.id from user_id
  SELECT id INTO v_bot_id
  FROM bot_settings
  WHERE user_id = p_bot_user_id AND is_active = true
  LIMIT 1;

  IF v_bot_id IS NULL THEN
    RETURN;
  END IF;

  v_body := jsonb_build_object(
    'action', p_action,
    'bot_id', v_bot_id,
    'target_id', p_target_user_id,
    'target_username', p_target_username,
    'context', p_context,
    'triggered_by', 'db_trigger'
  );

  IF p_profile_owner_id IS NOT NULL THEN
    v_body := v_body || jsonb_build_object('profile_owner_id', p_profile_owner_id);
  END IF;

  -- Async HTTP call via pg_net (non-blocking, wrapped in exception handler)
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := v_body
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'invoke_bot_respond: http_post failed: %', SQLERRM;
  END;
END;
$$;