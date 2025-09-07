-- Create organization logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true);

-- Create RLS policies for organization logo management
CREATE POLICY "Organization admins can view all organization logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

CREATE POLICY "Organization admins can upload their organization logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] = (
    SELECT organizations.slug 
    FROM organizations 
    JOIN profiles ON profiles.organization_id = organizations.id 
    WHERE profiles.id = auth.uid()
  )
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Organization admins can update their organization logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] = (
    SELECT organizations.slug 
    FROM organizations 
    JOIN profiles ON profiles.organization_id = organizations.id 
    WHERE profiles.id = auth.uid()
  )
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Organization admins can delete their organization logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] = (
    SELECT organizations.slug 
    FROM organizations 
    JOIN profiles ON profiles.organization_id = organizations.id 
    WHERE profiles.id = auth.uid()
  )
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

-- Super admins can manage all organization logos
CREATE POLICY "Super admins can manage all organization logos"
ON storage.objects FOR ALL
USING (bucket_id = 'organization-logos' AND is_super_admin(auth.uid()))
WITH CHECK (bucket_id = 'organization-logos' AND is_super_admin(auth.uid()));