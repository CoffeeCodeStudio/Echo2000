
-- 1. Fix user_roles UPDATE policy: change from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix memory_sessions SELECT: require authentication
DROP POLICY IF EXISTS "Service reads sessions" ON public.memory_sessions;
CREATE POLICY "Authenticated users can read sessions"
  ON public.memory_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Fix chat-files bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'chat-files';

-- 4. Fix chat-files storage SELECT policy: require authentication
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Chat files are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated users can view chat files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);
