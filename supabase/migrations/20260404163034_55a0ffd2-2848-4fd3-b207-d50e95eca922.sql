
CREATE OR REPLACE FUNCTION public.get_inactive_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  username text,
  avatar_url text,
  last_seen timestamptz,
  days_inactive numeric,
  friend_requests bigint,
  guestbook_entries bigint,
  profile_views bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.username,
    p.avatar_url,
    p.last_seen,
    ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(p.last_seen, p.created_at))) / 86400)::numeric AS days_inactive,
    (SELECT COUNT(*) FROM friends f
     WHERE f.friend_id = p.user_id
       AND f.status = 'pending'
       AND f.created_at > COALESCE(p.last_seen, p.created_at)) AS friend_requests,
    (SELECT COUNT(*) FROM profile_guestbook pg
     WHERE pg.profile_owner_id = p.user_id
       AND pg.created_at > COALESCE(p.last_seen, p.created_at)) AS guestbook_entries,
    (SELECT COUNT(*) FROM profile_visits pv
     WHERE pv.profile_owner_id = p.user_id
       AND pv.visited_at > COALESCE(p.last_seen, p.created_at)) AS profile_views
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (now() - COALESCE(p.last_seen, p.created_at))) / 86400 >= 7
  ORDER BY days_inactive DESC;
END;
$$;
