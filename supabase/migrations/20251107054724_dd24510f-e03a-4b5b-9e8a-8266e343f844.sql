-- Add logo_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN public.clients.logo_url IS 'URL to client logo stored in Supabase Storage';

-- Create storage bucket for client logos (public for performance)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for client-logos bucket
CREATE POLICY "Public can view client logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-logos');

CREATE POLICY "Authenticated users can upload client logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Org users can update their client logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Org users can delete their client logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-logos'
  AND auth.role() = 'authenticated'
);