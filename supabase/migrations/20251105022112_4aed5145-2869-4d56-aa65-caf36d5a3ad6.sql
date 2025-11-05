-- Create three clients under Hayes Recruiting Solutions
WITH hayes AS (
  SELECT id FROM organizations WHERE slug = 'hayes-recruiting-solutions' LIMIT 1
)
INSERT INTO clients (
  name,
  company,
  organization_id,
  status,
  notes,
  created_at,
  updated_at
)
SELECT 
  client_data.name,
  client_data.company,
  hayes.id,
  'active',
  client_data.notes,
  NOW(),
  NOW()
FROM hayes
CROSS JOIN (
  VALUES 
    ('Novco', 'Novco', 'Client added for CDL Job Cast webhook routing. Auth Key: WJxboyNegw'),
    ('Pemberton', 'Pemberton', 'Client added for CDL Job Cast webhook routing. Auth Key: KGRb4L0bBL'),
    ('Day & Ross', 'Day & Ross', 'Client added for CDL Job Cast webhook routing. Auth Key: rlNbWqXeyg')
) AS client_data(name, company, notes);

-- Create job listings for each client
WITH client_info AS (
  SELECT 
    c.id as client_id,
    c.name as client_name,
    c.organization_id
  FROM clients c
  WHERE c.name IN ('Novco', 'Pemberton', 'Day & Ross')
    AND c.organization_id = (SELECT id FROM organizations WHERE slug = 'hayes-recruiting-solutions' LIMIT 1)
),
hayes_user AS (
  SELECT id FROM profiles 
  WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'hayes-recruiting-solutions' LIMIT 1)
  ORDER BY created_at
  LIMIT 1
),
first_category AS (
  SELECT id FROM job_categories ORDER BY created_at LIMIT 1
)
INSERT INTO job_listings (
  title,
  job_summary,
  location,
  client_id,
  organization_id,
  user_id,
  category_id,
  status,
  created_at,
  updated_at
)
SELECT 
  'CDL-A Driver - ' || ci.client_name,
  'CDL-A driving position for ' || ci.client_name || '. Applications routed from CDL Job Cast.',
  CASE ci.client_name
    WHEN 'Day & Ross' THEN 'Canada'
    WHEN 'Pemberton' THEN 'Canada'
    ELSE 'United States'
  END,
  ci.client_id,
  ci.organization_id,
  hu.id,
  fc.id,
  'active',
  NOW(),
  NOW()
FROM client_info ci
CROSS JOIN hayes_user hu
CROSS JOIN first_category fc;