-- Batch 1: Solo Owner Operator - OTR Lease Purchase (35 state-level listings)
-- Splitting into smaller sub-batches for reliability

INSERT INTO job_listings (user_id, organization_id, client_id, category_id, title, job_summary, location, city, state, salary_min, salary_max, salary_type, job_type, experience_level, status)
SELECT 
  '5761e7e0-1bdf-43b1-ba5f-19a24f9d025e'::uuid,
  '84214b48-7b51-45bc-ad7f-723bcf50466c'::uuid,
  'be8b645e-d480-4c22-8e75-b09a7fc1db7a'::uuid,
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84'::uuid,
  'Solo Owner Operator - OTR Lease Purchase | ' || s.full_name,
  parent.job_summary,
  s.metro || ', ' || s.abbr,
  s.metro,
  s.abbr,
  parent.salary_min,
  parent.salary_max,
  parent.salary_type,
  parent.job_type,
  'mid',
  'active'
FROM job_listings parent
CROSS JOIN (VALUES
  ('AZ','Phoenix','Arizona'),('UT','Salt Lake City','Utah'),('CO','Denver','Colorado'),
  ('NM','Albuquerque','New Mexico'),('TX','Dallas','Texas'),('OK','Oklahoma City','Oklahoma'),
  ('AR','Little Rock','Arkansas'),('LA','Baton Rouge','Louisiana'),('MS','Jackson','Mississippi'),
  ('AL','Birmingham','Alabama'),('TN','Nashville','Tennessee'),('KY','Louisville','Kentucky'),
  ('GA','Atlanta','Georgia'),('FL','Jacksonville','Florida'),('SC','Columbia','South Carolina'),
  ('NC','Charlotte','North Carolina'),('VA','Richmond','Virginia'),('WV','Charleston','West Virginia'),
  ('OH','Columbus','Ohio'),('IN','Indianapolis','Indiana'),('IL','Chicago','Illinois'),
  ('MO','Kansas City','Missouri'),('KS','Wichita','Kansas'),('NE','Omaha','Nebraska'),
  ('IA','Des Moines','Iowa'),('SD','Sioux Falls','South Dakota'),('MN','Minneapolis','Minnesota'),
  ('WI','Milwaukee','Wisconsin'),('MI','Detroit','Michigan'),('PA','Harrisburg','Pennsylvania'),
  ('NY','Syracuse','New York'),('CT','Hartford','Connecticut'),('NJ','Newark','New Jersey'),
  ('DE','Wilmington','Delaware'),('MD','Baltimore','Maryland')
) AS s(abbr, metro, full_name)
WHERE parent.id = '99d461b1-96c1-4cf2-823e-f29781d2009f';

-- Batch 2: Solo Owner Operator - Regional Lease Purchase (20 state-level listings)
INSERT INTO job_listings (user_id, organization_id, client_id, category_id, title, job_summary, location, city, state, salary_min, salary_max, salary_type, job_type, experience_level, status)
SELECT 
  '5761e7e0-1bdf-43b1-ba5f-19a24f9d025e'::uuid,
  '84214b48-7b51-45bc-ad7f-723bcf50466c'::uuid,
  'be8b645e-d480-4c22-8e75-b09a7fc1db7a'::uuid,
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84'::uuid,
  'Solo Owner Operator - Regional Lease Purchase | ' || s.full_name,
  parent.job_summary,
  s.metro || ', ' || s.abbr,
  s.metro,
  s.abbr,
  parent.salary_min,
  parent.salary_max,
  parent.salary_type,
  parent.job_type,
  'mid',
  'active'
FROM job_listings parent
CROSS JOIN (VALUES
  ('TX','Dallas','Texas'),('AR','Little Rock','Arkansas'),('LA','Baton Rouge','Louisiana'),
  ('MS','Jackson','Mississippi'),('AL','Birmingham','Alabama'),('TN','Nashville','Tennessee'),
  ('KY','Louisville','Kentucky'),('GA','Atlanta','Georgia'),('SC','Columbia','South Carolina'),
  ('NC','Charlotte','North Carolina'),('VA','Richmond','Virginia'),('FL','Jacksonville','Florida'),
  ('OK','Oklahoma City','Oklahoma'),('KS','Wichita','Kansas'),('NE','Omaha','Nebraska'),
  ('IA','Des Moines','Iowa'),('MN','Minneapolis','Minnesota'),('WI','Milwaukee','Wisconsin'),
  ('IL','Chicago','Illinois'),('MO','Kansas City','Missouri')
) AS s(abbr, metro, full_name)
WHERE parent.id = '0614cde1-ccf3-4ef8-84aa-fa3e2694f29d';

-- Batch 3: Team Owner Operators - OTR (18 state-level listings)
INSERT INTO job_listings (user_id, organization_id, client_id, category_id, title, job_summary, location, city, state, salary_min, salary_max, salary_type, job_type, experience_level, status)
SELECT 
  '5761e7e0-1bdf-43b1-ba5f-19a24f9d025e'::uuid,
  '84214b48-7b51-45bc-ad7f-723bcf50466c'::uuid,
  'be8b645e-d480-4c22-8e75-b09a7fc1db7a'::uuid,
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84'::uuid,
  'Team Owner Operators - OTR | ' || s.full_name,
  parent.job_summary,
  s.metro || ', ' || s.abbr,
  s.metro,
  s.abbr,
  parent.salary_min,
  parent.salary_max,
  parent.salary_type,
  parent.job_type,
  'mid',
  'active'
FROM job_listings parent
CROSS JOIN (VALUES
  ('TX','Dallas','Texas'),('GA','Atlanta','Georgia'),('FL','Jacksonville','Florida'),
  ('TN','Nashville','Tennessee'),('IL','Chicago','Illinois'),('OH','Columbus','Ohio'),
  ('IN','Indianapolis','Indiana'),('PA','Harrisburg','Pennsylvania'),('NC','Charlotte','North Carolina'),
  ('VA','Richmond','Virginia'),('MO','Kansas City','Missouri'),('AL','Birmingham','Alabama'),
  ('KY','Louisville','Kentucky'),('MS','Jackson','Mississippi'),('AR','Little Rock','Arkansas'),
  ('LA','Baton Rouge','Louisiana'),('OK','Oklahoma City','Oklahoma'),('NJ','Newark','New Jersey')
) AS s(abbr, metro, full_name)
WHERE parent.id = 'd77332d7-7ea7-4320-af34-bc360fa2958d';

-- Batch 4: Owner Operator - BYOT Reefer (20 state-level listings)
INSERT INTO job_listings (user_id, organization_id, client_id, category_id, title, job_summary, location, city, state, salary_min, salary_max, salary_type, job_type, experience_level, status)
SELECT 
  '5761e7e0-1bdf-43b1-ba5f-19a24f9d025e'::uuid,
  '84214b48-7b51-45bc-ad7f-723bcf50466c'::uuid,
  'be8b645e-d480-4c22-8e75-b09a7fc1db7a'::uuid,
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84'::uuid,
  'Owner Operator - Bring Your Own Truck (Reefer) | ' || s.full_name,
  parent.job_summary,
  s.metro || ', ' || s.abbr,
  s.metro,
  s.abbr,
  parent.salary_min,
  parent.salary_max,
  parent.salary_type,
  parent.job_type,
  'mid',
  'active'
FROM job_listings parent
CROSS JOIN (VALUES
  ('TX','Dallas','Texas'),('FL','Jacksonville','Florida'),('GA','Atlanta','Georgia'),
  ('AZ','Phoenix','Arizona'),('CO','Denver','Colorado'),('AL','Birmingham','Alabama'),
  ('MS','Jackson','Mississippi'),('LA','Baton Rouge','Louisiana'),('AR','Little Rock','Arkansas'),
  ('TN','Nashville','Tennessee'),('KY','Louisville','Kentucky'),('NC','Charlotte','North Carolina'),
  ('SC','Columbia','South Carolina'),('VA','Richmond','Virginia'),('PA','Harrisburg','Pennsylvania'),
  ('NY','Syracuse','New York'),('OH','Columbus','Ohio'),('IN','Indianapolis','Indiana'),
  ('IL','Chicago','Illinois'),('NJ','Newark','New Jersey')
) AS s(abbr, metro, full_name)
WHERE parent.id = '4eb6e012-9fc5-441c-bc24-46225d23d83b';