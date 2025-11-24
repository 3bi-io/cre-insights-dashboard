-- Fix database functions to use immutable search_path
-- This prevents privilege escalation attacks

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update normalize_phone_number function (already has search_path)
-- No changes needed

-- Update classify_traffic_source function (already has search_path)
-- No changes needed

-- Update is_super_admin function (already has search_path)
-- No changes needed

-- Update get_user_organization_id function (already has search_path)
-- No changes needed

-- Update organization_has_platform_access function (already has search_path)
-- No changes needed

-- Update get_user_platform_access function (already has search_path)
-- No changes needed

-- Update has_active_subscription function (already has search_path)
-- No changes needed

-- Update update_client_webhook_updated_at function
CREATE OR REPLACE FUNCTION public.update_client_webhook_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update get_applications_list_with_audit function (already has search_path)
-- No changes needed

-- Update get_application_with_audit function (already has search_path)
-- No changes needed

-- Update create_application_with_audit function (already has search_path)
-- No changes needed

-- Update update_application_with_audit function (already has search_path)
-- No changes needed

-- Update ensure_admin_for_email function (already has search_path)
-- No changes needed

-- Update ensure_super_admin_for_email function (already has search_path)
-- No changes needed

-- Update update_user_status function (already has search_path)
-- No changes needed

-- Update get_organization_applications function (already has search_path)
-- No changes needed

-- Update has_role function (already has search_path)
-- No changes needed

-- Update get_current_user_role function (already has search_path)
-- No changes needed

-- Update update_platform_analytics_updated_at function
CREATE OR REPLACE FUNCTION public.update_platform_analytics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update handle_user_update function (already has search_path)
-- No changes needed

-- Update create_organization function (already has search_path)
-- No changes needed

-- Update update_organization_features function (already has search_path)
-- No changes needed

-- Update set_organization_platform_access function (already has search_path)
-- No changes needed

-- Update get_application_basic_data function (already has search_path)
-- No changes needed

-- Update get_application_sensitive_data function (already has search_path)
-- No changes needed

-- Update get_application_summary function (already has search_path)
-- No changes needed

-- Update get_organization_with_stats function (already has search_path)
-- No changes needed

-- Update get_organization_platform_access function (already has search_path)
-- No changes needed

-- Update get_application_organization_id function (already has search_path)
-- No changes needed

-- Update get_org_id_by_slug function (already has search_path)
-- No changes needed

-- Update check_rate_limit function (already has search_path)
-- No changes needed

-- Update handle_new_user function (already has search_path)
-- No changes needed

-- Update auto_create_client_for_job function (already has search_path)
-- No changes needed

-- Update cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_feed_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.feed_access_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sms_magic_links
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_analysis_cache
  WHERE expires_at < now();
END;
$$;

-- Update trigger_outbound_webhook function
CREATE OR REPLACE FUNCTION public.trigger_outbound_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update mark_orphaned_applications function
CREATE OR REPLACE FUNCTION public.mark_orphaned_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all applications linked to the deleted job with orphaned marker
  UPDATE applications
  SET job_listing_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE job_listing_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Update handle_tenstreet_credentials_updated_at function
CREATE OR REPLACE FUNCTION public.handle_tenstreet_credentials_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update get_dashboard_metrics function (already has search_path)
-- No changes needed

-- Update get_spend_chart_data function (already has search_path)
-- No changes needed

-- Update get_platform_breakdown_data function (already has search_path)
-- No changes needed

-- Update prevent_audit_log_changes function (already has search_path)
-- No changes needed

-- Update get_application_xchange_summary function (already has search_path)
-- No changes needed

-- Update get_organizations_credentials_summary function (already has search_path)
-- No changes needed

-- Update AI metrics functions
CREATE OR REPLACE FUNCTION public.update_ai_performance_metrics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ai_decision_tracking_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_elevenlabs_conversations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;