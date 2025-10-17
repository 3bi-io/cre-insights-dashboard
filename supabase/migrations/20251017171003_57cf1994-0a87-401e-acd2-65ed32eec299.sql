-- Enable ATS Explorer access for CR England organization
INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
VALUES ('682af95c-e95a-4e21-8753-ddef7f8c1749', 'ats_explorer', true)
ON CONFLICT (organization_id, platform_name) 
DO UPDATE SET enabled = true, updated_at = now();