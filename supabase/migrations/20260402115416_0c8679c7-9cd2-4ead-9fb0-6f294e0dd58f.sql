-- 1. Create a secure function to get the scribble word (only visible to drawer)
CREATE OR REPLACE FUNCTION public.get_scribble_word(p_lobby_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_word text;
  v_drawer_id uuid;
BEGIN
  SELECT current_word, current_drawer_id
  INTO v_word, v_drawer_id
  FROM scribble_lobbies
  WHERE id = p_lobby_id;

  -- Only return the word if the caller is the drawer
  IF v_drawer_id = auth.uid() THEN
    RETURN v_word;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Storage UPDATE policies

-- klotter: users can update their own files
CREATE POLICY "Users can update their own klotter images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'klotter'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- profile-photos: users can update their own photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- dj-tracks: admins can update tracks
CREATE POLICY "Admins can update DJ tracks"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'dj-tracks'
  AND has_role(auth.uid(), 'admin'::app_role)
);