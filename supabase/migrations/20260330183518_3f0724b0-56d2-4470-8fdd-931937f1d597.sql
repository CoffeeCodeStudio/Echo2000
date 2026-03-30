
CREATE OR REPLACE FUNCTION public.get_community_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'members', (SELECT count(*)::int FROM profiles),
    'messages', (SELECT count(*)::int FROM chat_messages) + (SELECT count(*)::int FROM messages),
    'guestbook', (SELECT count(*)::int FROM profile_guestbook),
    'klotter', (SELECT count(*)::int FROM klotter)
  )
$$;
