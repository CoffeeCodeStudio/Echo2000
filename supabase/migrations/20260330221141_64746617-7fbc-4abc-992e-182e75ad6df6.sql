
-- 1. Trigger to prevent non-admins from setting is_admin = true
CREATE OR REPLACE FUNCTION public.prevent_self_admin_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If is_admin is being set to true
  IF NEW.is_admin = true AND (OLD.is_admin IS DISTINCT FROM true) THEN
    -- Only allow if the current user is already an admin
    IF NOT has_role(auth.uid(), 'admin') THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_admin_self_promotion
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_admin_promotion();

-- 2. Fix news_comments SELECT policy: change from USING (true) to proper auth check
DROP POLICY IF EXISTS "Authenticated users can read news comments" ON public.news_comments;
CREATE POLICY "Authenticated users can read news comments"
ON public.news_comments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
