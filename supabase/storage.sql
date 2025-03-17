
-- Create buckets for posts and stories if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('posts', 'posts', true),
  ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for posts bucket
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policies for stories bucket
CREATE POLICY "Anyone can view story images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload story images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own story images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'stories' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own story images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
