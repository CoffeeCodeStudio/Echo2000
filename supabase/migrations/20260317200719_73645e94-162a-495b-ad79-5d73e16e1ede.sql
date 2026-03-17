
CREATE OR REPLACE FUNCTION public.notify_avatar_denied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  IF NEW.status = 'denied' AND (OLD.status IS DISTINCT FROM 'denied') THEN
    -- Use the reviewer or fall back to the first admin
    v_admin_id := NEW.reviewed_by;
    IF v_admin_id IS NULL THEN
      SELECT ur.user_id INTO v_admin_id
      FROM public.user_roles ur
      WHERE ur.role = 'admin'
      LIMIT 1;
    END IF;

    IF v_admin_id IS NOT NULL THEN
      INSERT INTO public.messages (sender_id, recipient_id, subject, content)
      VALUES (
        v_admin_id,
        NEW.user_id,
        'Din profilbild nekades',
        'Din uppladdade profilbild har nekats av en moderator.' || E'\n\n' ||
        'Anledning: ' || COALESCE(NEW.denial_reason, 'Ingen motivering angiven.') || E'\n\n' ||
        'Vänligen ladda upp en ny bild som följer reglerna (ansiktsbild med god kvalitet).'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_avatar_denied
AFTER UPDATE ON public.avatar_uploads
FOR EACH ROW
EXECUTE FUNCTION public.notify_avatar_denied();
