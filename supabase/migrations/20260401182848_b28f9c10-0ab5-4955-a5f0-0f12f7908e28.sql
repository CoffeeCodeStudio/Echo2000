
-- 1. Create a wrapper function that reads secrets from vault
CREATE OR REPLACE FUNCTION public.invoke_bot_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  v_url := 'https://fvmepxriuhmzcraeupjq.supabase.co/functions/v1/bot-cron';

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'bot_cron_api_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE WARNING 'bot_cron_api_key not found in vault, skipping invocation';
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

-- 2. Schedule bot-cron to run every minute
SELECT cron.schedule(
  'bot-cron-every-minute',
  '* * * * *',
  $$ SELECT public.invoke_bot_cron(); $$
);

-- 3. Schedule cleanup of old cron run details (every hour, remove rows older than 7 days)
SELECT cron.schedule(
  'bot-cron-cleanup',
  '0 * * * *',
  $$ DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days'; $$
);

-- 4. Create admin RPC to manage bot cron (status/pause/resume)
CREATE OR REPLACE FUNCTION public.manage_bot_cron(p_action text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id bigint;
  v_schedule text;
  v_last_run timestamptz;
  v_last_status text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_action = 'status' THEN
    SELECT jobid, schedule INTO v_job_id, v_schedule
    FROM cron.job
    WHERE jobname = 'bot-cron-every-minute'
    LIMIT 1;

    IF v_job_id IS NOT NULL THEN
      SELECT start_time, status INTO v_last_run, v_last_status
      FROM cron.job_run_details
      WHERE jobid = v_job_id
      ORDER BY start_time DESC
      LIMIT 1;
    END IF;

    RETURN json_build_object(
      'success', true,
      'active', v_job_id IS NOT NULL,
      'schedule', COALESCE(v_schedule, 'not scheduled'),
      'last_run', v_last_run,
      'last_status', v_last_status,
      'job_id', v_job_id
    );

  ELSIF p_action = 'pause' THEN
    PERFORM cron.unschedule('bot-cron-every-minute');
    RETURN json_build_object('success', true, 'action', 'paused');

  ELSIF p_action = 'resume' THEN
    SELECT cron.schedule(
      'bot-cron-every-minute',
      '* * * * *',
      $inner$ SELECT public.invoke_bot_cron(); $inner$
    ) INTO v_job_id;
    RETURN json_build_object('success', true, 'action', 'resumed', 'job_id', v_job_id);

  ELSE
    RETURN json_build_object('success', false, 'error', 'invalid action: use status, pause, or resume');
  END IF;
END;
$$;
