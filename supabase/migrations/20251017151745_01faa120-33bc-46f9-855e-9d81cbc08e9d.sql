-- Disable Import Applications access for ACME organization
INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
VALUES ('98f13347-333c-4f51-a162-015c2d61590f', 'import_applications', false)
ON CONFLICT (organization_id, platform_name)
DO UPDATE SET 
  enabled = false,
  updated_at = now();