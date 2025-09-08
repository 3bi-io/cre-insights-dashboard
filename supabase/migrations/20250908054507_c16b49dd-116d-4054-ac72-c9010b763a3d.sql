-- Phase 1: Security Hardening - Fix Critical RLS Policies and Function Security

-- 1. Fix Applications Table RLS - CRITICAL SECURITY FIX
-- Remove overly permissive policy that allows all authenticated users to view applications
DROP POLICY IF EXISTS "All authenticated users can view applications" ON public.applications;

-- Add proper organization-scoped RLS for applications
CREATE POLICY "Users can view applications in their organization" 
ON public.applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- 2. Fix Job Listings RLS - Restrict to organization members only
DROP POLICY IF EXISTS "Everyone can view job listings" ON public.job_listings;

CREATE POLICY "Organization members can view job listings" 
ON public.job_listings 
FOR SELECT 
USING (
  organization_id = get_user_organization_id() 
  OR is_super_admin(auth.uid())
);

-- 3. Fix Function Security - Add search_path to all functions missing it
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.ai_analysis_cache
  WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.sms_magic_links
  WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.trigger_outbound_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  webhook_url TEXT;
  job_user_id UUID;
BEGIN
  -- Get the user_id from the job listing
  SELECT user_id INTO job_user_id
  FROM job_listings 
  WHERE id = NEW.job_listing_id;
  
  -- Get the webhook URL for this user
  SELECT wc.webhook_url INTO webhook_url
  FROM webhook_configurations wc
  WHERE wc.user_id = job_user_id 
    AND wc.enabled = true
  LIMIT 1;
  
  -- If webhook URL exists, call the outbound webhook function
  IF webhook_url IS NOT NULL THEN
    PERFORM net.http_post(
      'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/outbound-webhook',
      json_build_object(
        'application_id', NEW.id,
        'webhook_url', webhook_url,
        'event_type', 'created'
      )::text,
      json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_spend_chart_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_platform_breakdown_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.normalize_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    digits_only TEXT;
    digit_count INTEGER;
BEGIN
    -- Return NULL if input is NULL or empty
    IF phone_input IS NULL OR trim(phone_input) = '' THEN
        RETURN NULL;
    END IF;

    -- Remove all non-digit characters
    digits_only := regexp_replace(phone_input, '[^0-9]', '', 'g');
    
    -- Return NULL if no digits or less than 10 digits
    digit_count := length(digits_only);
    IF digit_count < 10 THEN
        RETURN NULL;
    END IF;

    -- Handle different digit counts
    IF digit_count = 10 THEN
        -- 10 digits - add +1 country code
        RETURN '+1' || digits_only;
    ELSIF digit_count = 11 AND left(digits_only, 1) = '1' THEN
        -- 11 digits starting with 1 - already has country code
        RETURN '+' || digits_only;
    ELSIF digit_count = 11 AND left(digits_only, 1) != '1' THEN
        -- 11 digits not starting with 1 - assume it's a 10-digit number with extra digit
        RETURN '+1' || right(digits_only, 10);
    ELSIF digit_count > 11 THEN
        -- More than 11 digits - take last 10 and add +1
        RETURN '+1' || right(digits_only, 10);
    END IF;

    -- Fallback
    RETURN NULL;
END;
$function$;

-- 4. Add audit logging table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    organization_id uuid REFERENCES public.organizations(id),
    table_name text NOT NULL,
    record_id uuid,
    action text NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
    sensitive_fields text[], -- Array of field names accessed
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and super admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_super_admin(auth.uid())
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);