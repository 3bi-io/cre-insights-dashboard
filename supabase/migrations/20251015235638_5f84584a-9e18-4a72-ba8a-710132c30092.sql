
-- Update the user's profile to link to CR England organization
UPDATE profiles
SET organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749',
    full_name = 'Cody Forbes',
    updated_at = now()
WHERE id = 'f9082965-b24d-4244-b93d-ab547f2d4b02';

-- Create recruiter record for Cody Forbes at CR England
INSERT INTO recruiters (
  user_id,
  first_name,
  last_name,
  email,
  organization_id,
  status,
  created_at,
  updated_at
) VALUES (
  'f9082965-b24d-4244-b93d-ab547f2d4b02',
  'Cody',
  'Forbes',
  'codyforbes@gmail.com',
  '682af95c-e95a-4e21-8753-ddef7f8c1749',
  'active',
  now(),
  now()
);

-- Ensure user has the appropriate role for their organization
INSERT INTO user_roles (user_id, role, organization_id)
VALUES ('f9082965-b24d-4244-b93d-ab547f2d4b02', 'user', '682af95c-e95a-4e21-8753-ddef7f8c1749')
ON CONFLICT (user_id, role) 
DO UPDATE SET organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749';
