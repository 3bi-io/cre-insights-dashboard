-- Add Sysco as a client for CR England
INSERT INTO clients (
  name, 
  company, 
  city, 
  state, 
  status, 
  organization_id
) VALUES (
  'Sysco',
  'Sysco Corporation', 
  'Houston', 
  'TX', 
  'active',
  (SELECT id FROM organizations WHERE slug = 'cr-england')
);