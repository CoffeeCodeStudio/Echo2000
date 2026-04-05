-- Drop the overly permissive SELECT policy on chat-files
DROP POLICY IF EXISTS "Authenticated users can read chat files" ON storage.objects;

-- Create a scoped SELECT policy: users can only read files in their own folder
CREATE POLICY "Users can read own chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);