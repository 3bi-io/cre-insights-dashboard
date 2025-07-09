-- First, let's create job listings for each campaign location if they don't exist
-- We'll use the campaign data to create corresponding job listings

-- Insert job listings for each unique campaign location
INSERT INTO job_listings (id, user_id, platform_id, category_id, title, location, status, job_id, budget)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1), -- Use first available user
  (SELECT id FROM platforms WHERE name ILIKE '%meta%' OR name ILIKE '%facebook%' LIMIT 1), -- Meta/Facebook platform
  (SELECT id FROM job_categories LIMIT 1), -- Use first available category
  'Driver Position - ' || location_name,
  location_name,
  'active',
  campaign_id,
  total_budget
FROM (
  VALUES 
    ('cre-joliet-25-0623', 'Joliet, IL', 1587.86),
    ('cre-memphis-25-0623', 'Memphis, TN', 1528.22),
    ('cre-okc-25-0623', 'Oklahoma City, OK', 1516.42),
    ('cre-warrensburg-25-0623', 'Warrensburg, MO', 1496.68),
    ('cre-ridgefield-25-0623', 'Ridgefield, OR', 1480.0),
    ('cre-cowpens-25-0623', 'Cowpens, SC', 1477.18),
    ('cre-denver-25-0623', 'Denver, CO', 1440.54),
    ('cre-stgeorge-25-0623', 'St. George, UT', 1378.9),
    ('cre-denver-voice-25-0623', 'Denver, CO (Voice)', 959.72),
    ('new-leads-campaign', 'General Leads', 251.12),
    ('cre-denver-voice-copy-25-0623', 'Denver, CO (Voice Copy)', 82.14)
) AS campaigns(campaign_id, location_name, total_budget)
WHERE NOT EXISTS (
  SELECT 1 FROM job_listings WHERE job_id = campaigns.campaign_id
);

-- Now insert daily spend data
-- We'll distribute the spend across the reporting period (June 1 - July 9 = 39 days)
WITH campaign_data AS (
  SELECT 
    'cre-joliet-25-0623' as campaign_id,
    793.93 as amount,
    26725 as impressions,
    7 as clicks,
    '2025-06-01'::date as start_date,
    '2025-07-09'::date as end_date
  UNION ALL
  SELECT 'cre-memphis-25-0623', 764.11, 33465, 19, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-okc-25-0623', 758.21, 29617, 9, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-warrensburg-25-0623', 748.34, 25261, 6, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-ridgefield-25-0623', 740.0, 30878, 6, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-cowpens-25-0623', 738.59, 28650, 7, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-denver-25-0623', 720.27, 31535, 9, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-stgeorge-25-0623', 689.45, 30938, 6, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-denver-voice-25-0623', 479.86, 87892, 975, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'new-leads-campaign', 125.56, 62364, 104, '2025-06-01'::date, '2025-07-09'::date
  UNION ALL
  SELECT 'cre-denver-voice-copy-25-0623', 41.07, 16927, 79, '2025-06-01'::date, '2025-07-09'::date
),
date_series AS (
  SELECT generate_series('2025-06-01'::date, '2025-07-09'::date, '1 day'::interval)::date as spend_date
),
daily_breakdown AS (
  SELECT 
    jl.id as job_listing_id,
    ds.spend_date as date,
    ROUND(cd.amount / (cd.end_date - cd.start_date + 1), 2) as daily_amount,
    ROUND(cd.impressions / (cd.end_date - cd.start_date + 1)) as daily_views,
    ROUND(cd.clicks / (cd.end_date - cd.start_date + 1)) as daily_clicks
  FROM campaign_data cd
  CROSS JOIN date_series ds
  JOIN job_listings jl ON jl.job_id = cd.campaign_id
  WHERE ds.spend_date BETWEEN cd.start_date AND cd.end_date
)
INSERT INTO daily_spend (job_listing_id, date, amount, views, clicks)
SELECT 
  job_listing_id,
  date,
  daily_amount,
  daily_views,
  daily_clicks
FROM daily_breakdown
ON CONFLICT (job_listing_id, date) DO UPDATE SET
  amount = EXCLUDED.amount,
  views = EXCLUDED.views,
  clicks = EXCLUDED.clicks;