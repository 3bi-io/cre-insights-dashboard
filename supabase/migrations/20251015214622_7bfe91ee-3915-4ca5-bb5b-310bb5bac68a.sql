-- Create a comprehensive example campaign for C.R. England
INSERT INTO public.campaigns (
  id,
  user_id,
  organization_id,
  name,
  description,
  status,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-5678-90ab-cdef-123456789012',
  'f9082965-b24d-4244-b93d-ab547f2d4b02',
  '682af95c-e95a-4e21-8753-ddef7f8c1749',
  'Q1 2025 Regional Expansion - Midwest',
  'Strategic expansion campaign targeting experienced CDL-A drivers for dedicated routes across IL, MO, and IA markets. Focus on Dollar Tree dedicated account with competitive compensation and home time.',
  'active',
  now(),
  now()
);

-- Create a perfect example job group with comprehensive XML feed settings
INSERT INTO public.job_groups (
  id,
  user_id,
  organization_id,
  campaign_id,
  name,
  description,
  publisher_name,
  publisher_endpoint,
  status,
  xml_feed_settings,
  created_at,
  updated_at
) VALUES (
  'b2c3d4e5-6789-01bc-def1-234567890123',
  'f9082965-b24d-4244-b93d-ab547f2d4b02',
  '682af95c-e95a-4e21-8753-ddef7f8c1749',
  'a1b2c3d4-5678-90ab-cdef-123456789012',
  'Dollar Tree Dedicated - Midwest Regional',
  'Premium dedicated routes serving Dollar Tree distribution centers across Illinois, Missouri, and Iowa. Consistent freight, predictable schedules, and excellent home time. All positions require 6+ months recent OTR experience and clean driving record.',
  'Indeed Premium',
  'https://publisher.indeed.com/api/v1/xml/feeds',
  'active',
  jsonb_build_object(
    'feed_format', 'xml',
    'encoding', 'UTF-8',
    'include_company_info', true,
    'include_benefits', true,
    'include_requirements', true,
    'custom_fields', jsonb_build_object(
      'company_name', 'C.R. England',
      'company_description', 'Family-owned and operated since 1920, C.R. England is one of North America''s premier transportation companies. We offer industry-leading pay, comprehensive benefits, and a commitment to driver success.',
      'industry', 'Transportation & Logistics',
      'employment_type', 'Full-time',
      'benefits', jsonb_build_array(
        'Health Insurance (Medical, Dental, Vision)',
        'Paid Time Off & Holidays',
        '401(k) with Company Match',
        'Life Insurance',
        'Disability Coverage',
        'Rider Program',
        'Pet Policy',
        'No-Touch Freight',
        'Consistent Home Time',
        'Late-Model Equipment'
      ),
      'requirements', jsonb_build_array(
        'Valid CDL-A License',
        'Minimum 6 months recent OTR experience',
        'Clean driving record (no major violations)',
        'Pass DOT physical & drug screening',
        'Ability to operate 53'' dry van trailers',
        'Strong work ethic and reliability',
        '21+ years of age'
      ),
      'application_method', jsonb_build_object(
        'type', 'external',
        'url', 'https://www.crengland.com/apply',
        'email', 'recruiting@crengland.com',
        'phone', '1-800-453-1482'
      )
    ),
    'seo_settings', jsonb_build_object(
      'keywords', jsonb_build_array(
        'CDL-A driver jobs',
        'dedicated truck driver',
        'regional trucking',
        'Dollar Tree driver',
        'home weekly trucking',
        'no-touch freight',
        'dry van driver'
      ),
      'location_targeting', true,
      'geo_targeting', jsonb_build_array('IL', 'MO', 'IA', 'IN'),
      'exclude_locations', jsonb_build_array()
    ),
    'budget_settings', jsonb_build_object(
      'daily_budget', 250,
      'max_cpc', 3.50,
      'target_cpa', 85,
      'auto_optimize', true
    ),
    'scheduling', jsonb_build_object(
      'always_on', false,
      'start_date', '2025-01-15',
      'end_date', '2025-03-31',
      'time_of_day', jsonb_build_array(
        jsonb_build_object('start', '06:00', 'end', '22:00', 'days', jsonb_build_array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
        jsonb_build_object('start', '08:00', 'end', '18:00', 'days', jsonb_build_array('Saturday', 'Sunday'))
      )
    ),
    'tracking', jsonb_build_object(
      'google_analytics_id', 'UA-XXXXX-1',
      'conversion_tracking', true,
      'utm_parameters', jsonb_build_object(
        'source', 'indeed',
        'medium', 'xml_feed',
        'campaign', 'midwest_regional_q1_2025'
      )
    )
  ),
  now(),
  now()
);

-- Assign jobs to the group (Dollar Tree dedicated routes in the Midwest)
INSERT INTO public.job_group_assignments (
  id,
  job_group_id,
  job_listing_id,
  created_at
) 
SELECT 
  gen_random_uuid(),
  'b2c3d4e5-6789-01bc-def1-234567890123',
  id,
  now()
FROM job_listings
WHERE organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749'
  AND title ILIKE '%Dollar Tree%'
  AND state IN ('IL', 'MO', 'IA')
LIMIT 8;

-- Add helpful comment
COMMENT ON TABLE job_groups IS 'Job groups organize multiple job listings for syndication to publishers via XML/JSON feeds. Each group can have custom publisher settings, budget controls, and scheduling.';
COMMENT ON COLUMN job_groups.xml_feed_settings IS 'JSONB field containing comprehensive feed configuration including SEO, budget, scheduling, tracking, and custom publisher requirements.';