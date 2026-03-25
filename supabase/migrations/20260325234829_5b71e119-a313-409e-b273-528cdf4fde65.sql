
-- 1. Fix profiles SELECT: require authentication (was: true, allowing anonymous reads)
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 2. Fix user_roles SELECT: users can only see their own roles, admins can see all
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Fix friends DELETE: allow both sides of friendship to delete
DROP POLICY IF EXISTS "Users can delete their own friend requests" ON public.friends;
CREATE POLICY "Users can delete their own friendships" ON public.friends
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

-- 4. Rate limiting: profile_guestbook INSERT — max 5 per minute per user
DROP POLICY IF EXISTS "Authenticated users can write in guestbooks" ON public.profile_guestbook;
CREATE POLICY "Authenticated users can write in guestbooks with rate limit" ON public.profile_guestbook
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (
      SELECT count(*) FROM public.profile_guestbook pg
      WHERE pg.author_id = auth.uid()
        AND pg.created_at > (now() - interval '1 minute')
    ) < 5
  );

-- 5. Rate limiting: lajv_messages INSERT — max 5 per minute per user
DROP POLICY IF EXISTS "Authenticated users can insert lajv messages" ON public.lajv_messages;
CREATE POLICY "Authenticated users can insert lajv messages with rate limit" ON public.lajv_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND (
      SELECT count(*) FROM public.lajv_messages lm
      WHERE lm.user_id = auth.uid()
        AND lm.created_at > (now() - interval '1 minute')
    ) < 5
  );
