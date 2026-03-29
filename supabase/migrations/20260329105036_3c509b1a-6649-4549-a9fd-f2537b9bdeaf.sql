
-- Create storage bucket for DJ music files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dj-tracks', 'dj-tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload DJ tracks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dj-tracks'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access for playback
CREATE POLICY "Anyone can read DJ tracks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dj-tracks');

-- Allow admins to delete
CREATE POLICY "Admins can delete DJ tracks"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dj-tracks'
  AND public.has_role(auth.uid(), 'admin')
);

-- DJ tracks table
CREATE TABLE public.dj_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Suno AI',
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  genre TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  play_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dj_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read active tracks
CREATE POLICY "Anyone can read active DJ tracks"
ON public.dj_tracks FOR SELECT
TO public
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage DJ tracks"
ON public.dj_tracks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
