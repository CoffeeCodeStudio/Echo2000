CREATE OR REPLACE FUNCTION public.invoke_bot_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fvmepxriuhmzcraeupjq.supabase.co/functions/v1/bot-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bWVweHJpdWhtemNyYWV1cGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDQwNTMsImV4cCI6MjA4MzQ4MDA1M30.kqCFAdmdkqOKDlxIC6fiVEBRjzmfHP8J2ASVAwkWo04'
    ),
    body := '{}'::jsonb
  );
END;
$$;