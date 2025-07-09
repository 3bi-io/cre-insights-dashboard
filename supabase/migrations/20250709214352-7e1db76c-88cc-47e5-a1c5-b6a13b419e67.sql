-- Create RPC function for spend chart data
CREATE OR REPLACE FUNCTION get_spend_chart_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH daily_data AS (
        SELECT 
            date,
            SUM(amount) as daily_spend,
            SUM(COALESCE(views, 0)) as daily_views,
            SUM(COALESCE(clicks, 0)) as daily_clicks
        FROM daily_spend
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date
        ORDER BY date
        LIMIT 10
    )
    SELECT json_agg(
        json_build_object(
            'date', TO_CHAR(date, 'Mon DD'),
            'spend', daily_spend,
            'views', daily_views,
            'clicks', daily_clicks
        )
    ) INTO result
    FROM daily_data;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create RPC function for platform breakdown data
CREATE OR REPLACE FUNCTION get_platform_breakdown_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_spend_amount NUMERIC;
BEGIN
    -- Get total spend across all platforms
    SELECT COALESCE(SUM(ds.amount), 0) INTO total_spend_amount
    FROM daily_spend ds
    JOIN job_listings jl ON ds.job_listing_id = jl.id
    JOIN platforms p ON jl.platform_id = p.id;
    
    -- Get platform breakdown
    WITH platform_spend AS (
        SELECT 
            p.name,
            SUM(ds.amount) as spend
        FROM daily_spend ds
        JOIN job_listings jl ON ds.job_listing_id = jl.id
        JOIN platforms p ON jl.platform_id = p.id
        GROUP BY p.name
    )
    SELECT json_agg(
        json_build_object(
            'name', name,
            'spend', spend,
            'value', CASE 
                WHEN total_spend_amount > 0 
                THEN ROUND((spend / total_spend_amount) * 100) 
                ELSE 0 
            END,
            'color', CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY spend DESC) = 1 THEN '#3b82f6'
                WHEN ROW_NUMBER() OVER (ORDER BY spend DESC) = 2 THEN '#10b981'
                WHEN ROW_NUMBER() OVER (ORDER BY spend DESC) = 3 THEN '#f59e0b'
                WHEN ROW_NUMBER() OVER (ORDER BY spend DESC) = 4 THEN '#ef4444'
                ELSE '#8b5cf6'
            END
        )
    ) INTO result
    FROM platform_spend;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;