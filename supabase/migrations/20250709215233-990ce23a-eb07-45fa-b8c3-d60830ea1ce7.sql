-- Clear existing sample data and add realistic campaign data
DELETE FROM daily_spend;
DELETE FROM applications;
DELETE FROM job_listings;

-- Insert realistic job listings based on the campaign data
INSERT INTO job_listings (id, user_id, platform_id, category_id, title, description, status, budget, created_at) 
SELECT 
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    (SELECT id FROM platforms WHERE name = 'Facebook' LIMIT 1),
    (SELECT id FROM job_categories LIMIT 1),
    campaign_name,
    'Job posting for ' || campaign_name,
    'active',
    budget_amount,
    created_date
FROM (VALUES
    ('New Traffic Ad set with recommended opt', 2500.00, '2025-06-01'::date),
    ('cre-denver-25-0623', 1500.00, '2025-06-24'::date),
    ('New Leads Campaign', 2000.00, '2025-06-16'::date),
    ('cre-memphis-25-0623', 1800.00, '2025-06-29'::date),
    ('cre-okc-25-0623', 1600.00, '2025-06-29'::date),
    ('cre-joliet-25-0623', 1700.00, '2025-06-29'::date),
    ('cre-cowpens-25-0623', 1400.00, '2025-06-29'::date),
    ('cre-warrensburg-25-0623', 1500.00, '2025-06-29'::date),
    ('cre-ridgefield_or-25-0623', 1650.00, '2025-06-29'::date),
    ('cre-stgeorge_ut-25-0623', 1300.00, '2025-06-29'::date)
) AS campaigns(campaign_name, budget_amount, created_date);

-- Insert realistic daily spend data with metrics from the image
WITH job_data AS (
    SELECT id, title FROM job_listings
),
spend_data AS (
    SELECT 
        jd.id as job_listing_id,
        spend_date,
        amount,
        reach,
        impressions,
        result_count
    FROM job_data jd
    CROSS JOIN (VALUES
        ('2025-07-01'::date, 364.46, 197986, 646885, 2278),
        ('2025-07-02'::date, 335.25, 197816, 545617, 2085),
        ('2025-07-03'::date, 479.86, 53203, 87892, 975),
        ('2025-07-04'::date, 125.56, 49505, 62364, 104),
        ('2025-07-05'::date, 41.07, 9077, 16927, 79),
        ('2025-07-06'::date, 764.93, 14037, 33523, 19),
        ('2025-07-07'::date, 722.75, 13007, 31583, 9),
        ('2025-07-08'::date, 760.56, 12116, 29669, 9),
        ('2025-07-09'::date, 795.63, 15847, 26760, 7)
    ) AS daily_data(spend_date, amount, reach, impressions, result_count)
    WHERE jd.title IN (
        'New Traffic Ad set with recommended opt',
        'cre-denver-25-0623',
        'New Leads Campaign',
        'cre-memphis-25-0623',
        'cre-okc-25-0623',
        'cre-joliet-25-0623',
        'cre-cowpens-25-0623',
        'cre-warrensburg-25-0623',
        'cre-ridgefield_or-25-0623',
        'cre-stgeorge_ut-25-0623'
    )
)
INSERT INTO daily_spend (job_listing_id, date, amount, views, clicks)
SELECT 
    job_listing_id,
    spend_date,
    amount,
    impressions,
    reach
FROM spend_data;

-- Insert realistic applications data
WITH job_data AS (
    SELECT id FROM job_listings
),
app_data AS (
    SELECT 
        jd.id as job_listing_id,
        app_date,
        app_count
    FROM job_data jd
    CROSS JOIN (VALUES
        ('2025-07-01'::date, 45),
        ('2025-07-02'::date, 38),
        ('2025-07-03'::date, 22),
        ('2025-07-04'::date, 15),
        ('2025-07-05'::date, 12),
        ('2025-07-06'::date, 8),
        ('2025-07-07'::date, 6),
        ('2025-07-08'::date, 9),
        ('2025-07-09'::date, 11)
    ) AS daily_apps(app_date, app_count)
)
INSERT INTO applications (job_listing_id, applied_at, applicant_name, applicant_email, status)
SELECT 
    job_listing_id,
    app_date + (random() * interval '23 hours'),
    'Applicant ' || generate_series,
    'applicant' || generate_series || '@email.com',
    CASE 
        WHEN random() < 0.7 THEN 'pending'
        WHEN random() < 0.9 THEN 'reviewed'
        ELSE 'hired'
    END
FROM app_data, generate_series(1, app_count);

-- Update RPC functions to include new metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_spend_amount NUMERIC := 0;
    total_applications_count INTEGER := 0;
    total_jobs_count INTEGER := 0;
    total_reach INTEGER := 0;
    total_impressions INTEGER := 0;
    cost_per_app NUMERIC := 0;
    cost_per_lead NUMERIC := 0;
    result JSON;
BEGIN
    -- Get total spend for current month
    SELECT COALESCE(SUM(amount), 0) INTO total_spend_amount
    FROM daily_spend
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Get total reach and impressions
    SELECT 
        COALESCE(SUM(clicks), 0),
        COALESCE(SUM(views), 0)
    INTO total_reach, total_impressions
    FROM daily_spend
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Get total applications count
    SELECT COUNT(*) INTO total_applications_count
    FROM applications;
    
    -- Get total job listings count
    SELECT COUNT(*) INTO total_jobs_count
    FROM job_listings
    WHERE status = 'active';
    
    -- Calculate cost per application and cost per lead
    IF total_applications_count > 0 THEN
        cost_per_app := total_spend_amount / total_applications_count;
        cost_per_lead := total_spend_amount / total_applications_count;
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'totalSpend', total_spend_amount,
        'totalApplications', total_applications_count,
        'totalJobs', total_jobs_count,
        'totalReach', total_reach,
        'totalImpressions', total_impressions,
        'costPerApplication', cost_per_app,
        'costPerLead', cost_per_lead
    );
    
    RETURN result;
END;
$$;