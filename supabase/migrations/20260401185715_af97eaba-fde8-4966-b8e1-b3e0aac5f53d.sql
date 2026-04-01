CREATE OR REPLACE FUNCTION public.invoke_bot_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  v_url := rtrim(current_setting('supabase.url', true), '/') || '/functions/v1/bot-cron';

  -- Try service_role_key first, fall back to anon_key
  v_key := current_setting('supabase.service_role_key', true);
  
  IF v_key IS NULL OR v_key = '' THEN
    v_key := current_setting('supabase.anon_key', true);
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    -- Last resort: try vault
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'bot_cron_api_key'
    LIMIT 1;
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING 'No API key available for bot-cron invocation';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
END;
$$;