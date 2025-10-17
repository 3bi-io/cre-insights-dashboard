-- Update top 5 clients to belong to Demo organization
UPDATE public.clients
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'demo' LIMIT 1)
WHERE name IN (
  'Demo Freight Services',
  'Demo Logistics Inc',
  'Example Shipping Corp',
  'Sample Transport Co',
  'Test Distribution LLC'
);

-- Verify the Demo organization exists, if not create it
INSERT INTO public.organizations (name, slug)
VALUES ('Demo', 'demo')
ON CONFLICT (slug) DO NOTHING;