-- Create missing profile for super admin user c@3bi.io
INSERT INTO public.profiles (id, email, full_name, organization_id, enabled)
VALUES (
  '86b642cb-af7b-47df-9bd6-179db1ae7c95',
  'c@3bi.io',
  'Super Administrator',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  organization_id = EXCLUDED.organization_id,
  enabled = EXCLUDED.enabled,
  updated_at = now();