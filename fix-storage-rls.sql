-- Storage bucket RLS fix
-- Run this in Supabase SQL Editor

-- Allow INSERT (upload) for everyone
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'Cards_images');

-- Allow SELECT (read/download) for everyone  
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Cards_images');

-- Allow DELETE for everyone (optional)
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'Cards_images');
