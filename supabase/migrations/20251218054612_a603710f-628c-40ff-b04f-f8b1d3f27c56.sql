-- Assign cody@3bi.io as Admin for Hayes Recruiting Solutions

-- 1. Update profile to Hayes organization
UPDATE profiles 
SET organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c',
    updated_at = now()
WHERE id = 'ab57c07b-1730-4955-8b7a-2f22169c6865';

-- 2. Remove old user roles
DELETE FROM user_roles 
WHERE user_id = 'ab57c07b-1730-4955-8b7a-2f22169c6865';

-- 3. Insert admin role for Hayes
INSERT INTO user_roles (user_id, role, organization_id)
VALUES (
  'ab57c07b-1730-4955-8b7a-2f22169c6865',
  'admin',
  '84214b48-7b51-45bc-ad7f-723bcf50466c'
);