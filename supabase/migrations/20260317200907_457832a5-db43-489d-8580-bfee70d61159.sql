
CREATE OR REPLACE FUNCTION public.sync_approved_avatars()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH latest_approved AS (
    SELECT DISTINCT ON (user_id) user_id, image_url
    FROM public.avatar_uploads
    WHERE status = 'approved'
    ORDER BY user_id, created_at DESC
  ),
  updated AS (
    UPDATE public.profiles p
    SET avatar_url = la.image_url
    FROM latest_approved la
    WHERE la.user_id = p.user_id
      AND (p.avatar_url IS NULL OR p.avatar_url != la.image_url)
    RETURNING p.user_id
  )
  SELECT COUNT(*) INTO v_count FROM updated;
  RETURN v_count;
END;
$$;
