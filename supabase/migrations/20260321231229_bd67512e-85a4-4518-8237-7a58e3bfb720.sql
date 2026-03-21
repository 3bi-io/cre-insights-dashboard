-- Create Werner Enterprises and TMC Transportation clients
INSERT INTO clients (name, company, status, organization_id) VALUES
('Werner Enterprises', 'Werner Enterprises', 'active', '650cf2cc-22e7-4a52-8899-b56d315bed2a'),
('TMC Transportation', 'TMC Transportation', 'active', '650cf2cc-22e7-4a52-8899-b56d315bed2a');

-- Insert 3 job listings for Career Now Brands
-- Werner Enterprises listing
INSERT INTO job_listings (
  user_id, organization_id, category_id, title, job_title, job_summary,
  salary_min, salary_max, salary_type, job_type, experience_level, status, url,
  client_id
) VALUES (
  '02093ad0-afb0-4699-b164-ea7aca9ee4df',
  '650cf2cc-22e7-4a52-8899-b56d315bed2a',
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84',
  'Dedicated CDL-A Truck Drivers - Multiple Options Available',
  'CDL-A Dedicated Truck Driver',
  'Average $75,000-$85,000/Year. Multiple home time options (daily, weekly, bi-weekly). Comprehensive benefits including 401(k), health/dental/vision, $15,000 tuition reimbursement. Solo and team positions. Top performers earn $90,000-$100,000.',
  75000, 85000, 'yearly', 'Dedicated', 'entry', 'active',
  'https://cdljobnow.com/jobs/4802/werner-enterprises-dedicated-cdl-a-truck-driver-multiple-options-available?cc=48648m681',
  (SELECT id FROM clients WHERE name = 'Werner Enterprises' AND organization_id = '650cf2cc-22e7-4a52-8899-b56d315bed2a' LIMIT 1)
);

-- TMC Transportation listing
INSERT INTO job_listings (
  user_id, organization_id, category_id, title, job_title, job_summary,
  salary_min, salary_max, salary_type, job_type, experience_level, status, url,
  client_id
) VALUES (
  '02093ad0-afb0-4699-b164-ea7aca9ee4df',
  '650cf2cc-22e7-4a52-8899-b56d315bed2a',
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84',
  'CDL-A Flatbed Drivers',
  'CDL-A Flatbed Driver',
  'Earn up to $100,000 annually. Home weekends. Up to $5,000 sign-on bonus. Regional routes within 1,200-mile radius. Employee-owned (ESOP). No experience required. Peterbilt equipment.',
  70200, 100000, 'yearly', 'Regional', 'entry', 'active',
  'https://cdljobnow.com/jobs/7891/tmc-transportation-cdl-a-flatbed-driver?cc=48649barT',
  (SELECT id FROM clients WHERE name = 'TMC Transportation' AND organization_id = '650cf2cc-22e7-4a52-8899-b56d315bed2a' LIMIT 1)
);

-- Hub Group listing (client already exists)
INSERT INTO job_listings (
  user_id, organization_id, category_id, title, job_title, job_summary,
  salary_min, salary_max, salary_type, job_type, experience_level, status, url,
  client_id
) VALUES (
  '02093ad0-afb0-4699-b164-ea7aca9ee4df',
  '650cf2cc-22e7-4a52-8899-b56d315bed2a',
  '61bd5f79-b3c1-4804-a6a0-d568773c3d84',
  'Intermodal CDL-A Drivers - East',
  'Intermodal CDL-A Driver',
  'Earn $67,364-$98,500/year. Local and regional routes. No-touch freight. Multiple home time options including home daily. Health/dental/vision, 401(k) match, paid orientation. At least 1 year experience required.',
  67364, 98500, 'yearly', 'Local', 'mid', 'active',
  'https://cdljobnow.com/jobs/6023/hub-group-intermodal-cdl-a-driver-east?cc=48650041b',
  '8ca3faca-b91c-4ab8-a9af-b145ab265228'
);