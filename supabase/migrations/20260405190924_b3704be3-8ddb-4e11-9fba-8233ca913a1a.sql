-- 1. Remove redundant public SELECT policy on chat-files (private bucket should require auth)
DROP POLICY "Chat files are publicly readable" ON storage.objects;

-- 2. Remove the permissive klotter INSERT policy that lacks path-owner validation
DROP POLICY "Authenticated users can upload klotter images" ON storage.objects;