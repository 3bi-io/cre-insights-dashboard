-- Disable ATS Explorer access for ACME organization
-- Insert or update the platform access record
INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
VALUES ('98f13347-333c-4f51-a162-015c2d61590f', 'ats_explorer', false)
ON CONFLICT (organization_id, platform_name)
DO UPDATE SET 
  enabled = false,
  updated_at = now();