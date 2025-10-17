-- Create Demo organization if it doesn't exist
INSERT INTO organizations (name, slug, subscription_status)
VALUES ('Demo', 'demo', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Update all demo, example, and sample clients to Demo organization
UPDATE clients
SET organization_id = (SELECT id FROM organizations WHERE slug = 'demo')
WHERE 
  LOWER(name) LIKE '%demo%' 
  OR LOWER(name) LIKE '%example%' 
  OR LOWER(name) LIKE '%sample%'
  OR LOWER(company) LIKE '%demo%'
  OR LOWER(company) LIKE '%example%'
  OR LOWER(company) LIKE '%sample%';