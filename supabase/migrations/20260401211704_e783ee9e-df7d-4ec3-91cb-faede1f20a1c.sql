
-- Enable pg_net if not exists
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove existing jobs if they exist (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot-cron-every-minute') THEN
    PERFORM cron.unschedule('bot-cron-every-minute');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bot-cron-cleanup') THEN
    PERFORM cron.unschedule('bot-cron-cleanup');
  END IF;
END $$;

-- Schedule bot-cron every minute
SELECT cron.schedule(
  'bot-cron-every-minute',
  '* * * * *',
  $$SELECT public.invoke_bot_cron();$$
);

-- Cleanup old run details every hour
SELECT cron.schedule(
  'bot-cron-cleanup',
  '0 * * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';$$
);
