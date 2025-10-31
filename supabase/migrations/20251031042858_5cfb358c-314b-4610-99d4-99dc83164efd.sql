-- =====================================================
-- HIGH-PRIORITY: Storage Bucket Security Enhancement
-- =====================================================

-- Make organization-logos bucket private for better control
UPDATE storage.buckets 
SET public = false 
WHERE id = 'organization-logos';

-- Drop all existing storage policies to recreate them with proper scoping
DROP POLICY IF EXISTS "Admins can view application documents in their org" ON storage.objects;
DROP POLICY IF EXISTS "Admins view docs in their org only" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can view all application documents" ON storage.objects;
DROP POLICY IF EXISTS "Org admins view application documents in their org" ON storage.objects;
DROP POLICY IF EXISTS "Job owners can view their application documents" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload documents for their org" ON storage.objects;
DROP POLICY IF EXISTS "Public can view organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Org admins can upload their organization logo" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage all organization logos" ON storage.objects;

-- APPLICATION DOCUMENTS POLICIES (organization-scoped)

-- Super admins can view all application documents
CREATE POLICY "Super admins can view all application documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'application-documents' 
  AND is_super_admin(auth.uid())
);

-- Org admins can only view documents from their organization
CREATE POLICY "Org admins view application documents in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'application-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE (storage.foldername(name))[1] = a.id::text
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Job owners can view documents for their job applications
CREATE POLICY "Job owners can view their application documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'application-documents'
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE (storage.foldername(name))[1] = a.id::text
    AND jl.user_id = auth.uid()
  )
);

-- Super admins can upload documents
CREATE POLICY "Super admins can upload application documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents'
  AND is_super_admin(auth.uid())
);

-- Org admins can upload documents for their org's applications
CREATE POLICY "Org admins can upload documents for their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE (storage.foldername(name))[1] = a.id::text
    AND jl.organization_id = get_user_organization_id()
  )
);

-- ORGANIZATION LOGOS POLICIES (now private bucket)

-- Authenticated users can view organization logos
CREATE POLICY "Authenticated users can view organization logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'organization-logos'
  AND auth.role() = 'authenticated'
);

-- Org admins can upload their organization's logo
CREATE POLICY "Org admins can upload their organization logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = get_user_organization_id()::text
);

-- Super admins can manage all logos
CREATE POLICY "Super admins can manage all organization logos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'organization-logos'
  AND is_super_admin(auth.uid())
);