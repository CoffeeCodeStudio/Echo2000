
-- 1. Create bot_trigger_log table for tracking and dedup
CREATE TABLE public.bot_trigger_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source text NOT NULL,  -- 'chat', 'guestbook', 'email'
  bot_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  source_message_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_trigger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot_trigger_log"
  ON public.bot_trigger_log FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Index for dedup lookups
CREATE INDEX idx_bot_trigger_log_dedup
  ON public.bot_trigger_log (bot_user_id, target_user_id, created_at DESC);

-- Auto-cleanup: keep only 7 days
CREATE INDEX idx_bot_trigger_log_created
  ON public.bot_trigger_log (created_at);

-- 2. Create bot_trigger_settings for ON/OFF control
CREATE TABLE public.bot_trigger_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text UNIQUE NOT NULL,  -- 'chat', 'guestbook', 'email'
  is_enabled boolean NOT NULL DEFAULT true,
  delay_min_seconds integer NOT NULL DEFAULT 5,
  delay_max_seconds integer NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_trigger_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot_trigger_settings"
  ON public.bot_trigger_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.bot_trigger_settings (trigger_type, is_enabled, delay_min_seconds, delay_max_seconds)
VALUES
  ('chat', true, 5, 15),
  ('guestbook', true, 8, 20),
  ('email', true, 10, 25);

-- 3. Helper: check if trigger is enabled and bot should respond
CREATE OR REPLACE FUNCTION public.bot_should_respond(
  p_trigger_type text,
  p_bot_user_id uuid,
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled boolean;
  v_recent_count integer;
BEGIN
  -- Check if trigger type is enabled
  SELECT is_enabled INTO v_enabled
  FROM bot_trigger_settings
  WHERE trigger_type = p_trigger_type;

  IF v_enabled IS NULL OR v_enabled = false THEN
    RETURN false;
  END IF;

  -- Check if target is a bot (prevent bot-to-bot loops)
  IF EXISTS (
    SELECT 1 FROM profiles WHERE user_id = p_target_user_id AND is_bot = true
  ) THEN
    RETURN false;
  END IF;

  -- Check if bot is active
  IF NOT EXISTS (
    SELECT 1 FROM bot_settings WHERE user_id = p_bot_user_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- Dedup: skip if bot already responded to this user in last 30 seconds
  SELECT COUNT(*) INTO v_recent_count
  FROM bot_trigger_log
  WHERE bot_user_id = p_bot_user_id
    AND target_user_id = p_target_user_id
    AND created_at > now() - interval '30 seconds';

  IF v_recent_count > 0 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 4. Helper: invoke bot-respond via pg_net
CREATE OR REPLACE FUNCTION public.invoke_bot_respond(
  p_action text,
  p_bot_user_id uuid,
  p_target_user_id uuid,
  p_target_username text,
  p_context text,
  p_profile_owner_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
  v_bot_id uuid;  -- bot_settings.id, not user_id
  v_body jsonb;
BEGIN
  v_url := 'https://fvmepxriuhmzcraeupjq.supabase.co/functions/v1/bot-respond';

  -- Get service role key from vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'bot_respond_service_key'
  LIMIT 1;

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

  -- Async HTTP call via pg_net (non-blocking)
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := v_body
  );
END;
$$;

-- 5. TRIGGER: chat_messages — auto-reply when user messages a bot
CREATE OR REPLACE FUNCTION public.trigger_bot_chat_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_username text;
BEGIN
  -- Quick check: is recipient a bot that should respond?
  IF NOT bot_should_respond('chat', NEW.recipient_id, NEW.sender_id) THEN
    RETURN NEW;
  END IF;

  -- Get sender username
  SELECT username INTO v_sender_username
  FROM profiles WHERE user_id = NEW.sender_id LIMIT 1;

  -- Log the trigger
  INSERT INTO bot_trigger_log (trigger_source, bot_user_id, target_user_id, source_message_id)
  VALUES ('chat', NEW.recipient_id, NEW.sender_id, NEW.id);

  -- Invoke bot-respond asynchronously
  PERFORM invoke_bot_respond(
    'chat_reply',
    NEW.recipient_id,
    NEW.sender_id,
    COALESCE(v_sender_username, 'Okänd'),
    NEW.content
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bot_chat_reply
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bot_chat_reply();

-- 6. TRIGGER: profile_guestbook — auto-reply when user writes in bot's guestbook
CREATE OR REPLACE FUNCTION public.trigger_bot_guestbook_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quick check: is profile owner a bot that should respond?
  IF NOT bot_should_respond('guestbook', NEW.profile_owner_id, NEW.author_id) THEN
    RETURN NEW;
  END IF;

  -- Log the trigger
  INSERT INTO bot_trigger_log (trigger_source, bot_user_id, target_user_id, source_message_id)
  VALUES ('guestbook', NEW.profile_owner_id, NEW.author_id, NEW.id);

  -- Invoke bot-respond asynchronously
  PERFORM invoke_bot_respond(
    'profile_guestbook_reply',
    NEW.profile_owner_id,
    NEW.author_id,
    COALESCE(NEW.author_name, 'Okänd'),
    NEW.message,
    NEW.profile_owner_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bot_guestbook_reply
  AFTER INSERT ON public.profile_guestbook
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bot_guestbook_reply();

-- 7. TRIGGER: messages (email) — auto-reply when user sends email to a bot
CREATE OR REPLACE FUNCTION public.trigger_bot_email_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_username text;
BEGIN
  -- Quick check: is recipient a bot that should respond?
  IF NOT bot_should_respond('email', NEW.recipient_id, NEW.sender_id) THEN
    RETURN NEW;
  END IF;

  -- Get sender username
  SELECT username INTO v_sender_username
  FROM profiles WHERE user_id = NEW.sender_id LIMIT 1;

  -- Log the trigger
  INSERT INTO bot_trigger_log (trigger_source, bot_user_id, target_user_id, source_message_id)
  VALUES ('email', NEW.recipient_id, NEW.sender_id, NEW.id);

  -- Invoke bot-respond asynchronously
  PERFORM invoke_bot_respond(
    'email_reply',
    NEW.recipient_id,
    NEW.sender_id,
    COALESCE(v_sender_username, 'Okänd'),
    NEW.subject || ': ' || NEW.content
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bot_email_reply
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_bot_email_reply();

-- 8. Cleanup cron for bot_trigger_log (add to existing cleanup schedule)
SELECT cron.schedule(
  'bot-trigger-log-cleanup',
  '30 * * * *',
  $$ DELETE FROM public.bot_trigger_log WHERE created_at < now() - interval '7 days'; $$
);
