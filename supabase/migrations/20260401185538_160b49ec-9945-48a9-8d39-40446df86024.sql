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
  v_key := current_setting('supabase.service_role_key', true);

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING 'service_role_key not available, skipping bot-cron invocation';
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