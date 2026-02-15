-- Create public storage bucket for page assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-assets', 'page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to page-assets bucket
CREATE POLICY "Public read access for page-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-assets');

-- Allow authenticated users to upload to page-assets
CREATE POLICY "Authenticated users can upload to page-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'page-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads in page-assets
CREATE POLICY "Authenticated users can update page-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'page-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete from page-assets
CREATE POLICY "Authenticated users can delete from page-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'page-assets' AND auth.role() = 'authenticated');