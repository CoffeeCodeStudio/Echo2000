
CREATE OR REPLACE FUNCTION public.clear_all_bot_activity()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gb_count integer;
  v_pgb_count integer;
  v_email_count integer;
  v_chat_count integer;
  v_lajv_count integer;
  v_trigger_count integer;
  v_memory_count integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- Delete profile guestbook entries written by bots
  WITH deleted AS (
    DELETE FROM profile_guestbook
    WHERE author_id IN (SELECT user_id FROM profiles WHERE is_bot = true)
    RETURNING id
  ) SELECT count(*) INTO v_pgb_count FROM deleted;

  -- Delete public guestbook entries written by bots
  WITH deleted AS (
    DELETE FROM guestbook_entries
    WHERE user_id IN (SELECT user_id FROM profiles WHERE is_bot = true)
    RETURNING id
  ) SELECT count(*) INTO v_gb_count FROM deleted;

  -- Delete emails (messages) sent by bots
  WITH deleted AS (
    DELETE FROM messages
    WHERE sender_id IN (SELECT user_id FROM profiles WHERE is_bot = true)
    RETURNING id
  ) SELECT count(*) INTO v_email_count FROM deleted;

  -- Delete chat messages sent by bots
  WITH deleted AS (
    DELETE FROM chat_messages
    WHERE sender_id IN (SELECT user_id FROM profiles WHERE is_bot = true)
    RETURNING id
  ) SELECT count(*) INTO v_chat_count FROM deleted;

  -- Delete lajv messages from bots
  WITH deleted AS (
    DELETE FROM lajv_messages
    WHERE user_id IN (SELECT user_id FROM profiles WHERE is_bot = true)
    RETURNING id
  ) SELECT count(*) INTO v_lajv_count FROM deleted;

  -- Clear bot trigger log
  WITH deleted AS (
    DELETE FROM bot_trigger_log RETURNING id
  ) SELECT count(*) INTO v_trigger_count FROM deleted;

  -- Clear bot memories
  WITH deleted AS (
    DELETE FROM bot_memories RETURNING id
  ) SELECT count(*) INTO v_memory_count FROM deleted;

  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'profile_guestbook', v_pgb_count,
      'guestbook', v_gb_count,
      'emails', v_email_count,
      'chat', v_chat_count,
      'lajv', v_lajv_count,
      'trigger_log', v_trigger_count,
      'memories', v_memory_count
    )
  );
END;
$$;
