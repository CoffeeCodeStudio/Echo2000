
-- Create a trigger that prevents non-admins from changing is_approved or is_bot
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- If is_approved or is_bot is being changed, require admin role
  IF (NEW.is_approved IS DISTINCT FROM OLD.is_approved)
     OR (NEW.is_bot IS DISTINCT FROM OLD.is_bot) THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      -- Silently revert the protected fields
      NEW.is_approved := OLD.is_approved;
      NEW.is_bot := OLD.is_bot;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();
