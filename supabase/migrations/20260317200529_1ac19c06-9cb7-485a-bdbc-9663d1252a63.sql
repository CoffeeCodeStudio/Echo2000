
CREATE OR REPLACE FUNCTION public.sync_avatar_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
    SET avatar_url = NEW.image_url
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_avatar_on_approval
AFTER UPDATE ON public.avatar_uploads
FOR EACH ROW
EXECUTE FUNCTION public.sync_avatar_on_approval();
