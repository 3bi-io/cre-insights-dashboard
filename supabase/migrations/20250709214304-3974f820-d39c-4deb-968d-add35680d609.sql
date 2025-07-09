-- Create RPC functions to get aggregated data without RLS restrictions
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_spend_amount NUMERIC := 0;
    total_applications_count INTEGER := 0;
    total_jobs_count INTEGER := 0;
    cost_per_app NUMERIC := 0;
    result JSON;
BEGIN
    -- Get total spend for current month
    SELECT COALESCE(SUM(amount), 0) INTO total_spend_amount
    FROM daily_spend
    WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Get total applications count
    SELECT COUNT(*) INTO total_applications_count
    FROM applications;
    
    -- Get total job listings count
    SELECT COUNT(*) INTO total_jobs_count
    FROM job_listings
    WHERE status = 'active';
    
    -- Calculate cost per application
    IF total_applications_count > 0 THEN
        cost_per_app := total_spend_amount / total_applications_count;
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'totalSpend', total_spend_amount,
        'totalApplications', total_applications_count,
        'totalJobs', total_jobs_count,
        'costPerApplication', cost_per_app
    );
    
    RETURN result;
END;
$$;