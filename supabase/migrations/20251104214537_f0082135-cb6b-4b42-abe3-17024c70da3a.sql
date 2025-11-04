-- ============================================================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- Implements all Phase 1, 2, and 3 SQL-based security fixes
-- ============================================================================

-- ============================================================================
-- PHASE 1.1: Fix SECURITY DEFINER Functions - Add Fixed Search Path
-- ============================================================================

-- Priority 1: Authorization Functions (CRITICAL)
ALTER FUNCTION has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION is_super_admin(_user_id uuid) SET search_path = public;
ALTER FUNCTION get_current_user_role() SET search_path = public;

-- Priority 2: Organization Access Functions
ALTER FUNCTION get_user_organization_id() SET search_path = public;
ALTER FUNCTION organization_has_platform_access(_org_id uuid, _platform_name text) SET search_path = public;
ALTER FUNCTION get_user_platform_access(_platform_name text) SET search_path = public;

-- Priority 3: Admin Functions
ALTER FUNCTION ensure_admin_for_email(_email text, _org_slug text) SET search_path = public;
ALTER FUNCTION ensure_super_admin_for_email(_email text) SET search_path = public;
ALTER FUNCTION update_user_status(_user_id uuid, _enabled boolean) SET search_path = public;
ALTER FUNCTION create_organization(_name text, _slug text, _admin_email text) SET search_path = public;
ALTER FUNCTION update_organization_features(_org_id uuid, _features jsonb) SET search_path = public;
ALTER FUNCTION set_organization_platform_access(_org_id uuid, _platform_name text, _enabled boolean) SET search_path = public;

-- Priority 4: Data Access Functions
ALTER FUNCTION get_application_basic_data(application_id uuid) SET search_path = public;
ALTER FUNCTION get_application_sensitive_data(application_id uuid, access_reason text) SET search_path = public;
ALTER FUNCTION get_application_summary(application_id uuid) SET search_path = public;
ALTER FUNCTION get_organization_applications(_org_id uuid, _limit integer, _offset integer) SET search_path = public;
ALTER FUNCTION get_organization_with_stats(_org_id uuid) SET search_path = public;
ALTER FUNCTION get_organization_platform_access(_org_id uuid) SET search_path = public;
ALTER FUNCTION get_application_organization_id(_application_id uuid) SET search_path = public;

-- Priority 5: Utility Functions
ALTER FUNCTION get_org_id_by_slug(_slug text) SET search_path = public;
ALTER FUNCTION has_active_subscription(org_id uuid) SET search_path = public;
ALTER FUNCTION check_rate_limit(_identifier text, _endpoint text, _max_requests integer, _window_minutes integer) SET search_path = public;

-- Additional Functions
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION handle_user_update() SET search_path = public;
ALTER FUNCTION normalize_phone_number(phone_input text) SET search_path = public;
ALTER FUNCTION classify_traffic_source(referrer text) SET search_path = public;
ALTER FUNCTION auto_create_client_for_job() SET search_path = public;
ALTER FUNCTION cleanup_old_rate_limits() SET search_path = public;
ALTER FUNCTION cleanup_old_feed_logs() SET search_path = public;
ALTER FUNCTION cleanup_expired_sms_links() SET search_path = public;
ALTER FUNCTION cleanup_expired_cache() SET search_path = public;
ALTER FUNCTION trigger_outbound_webhook() SET search_path = public;
ALTER FUNCTION mark_orphaned_applications() SET search_path = public;
ALTER FUNCTION prevent_audit_log_changes() SET search_path = public;
ALTER FUNCTION handle_tenstreet_credentials_updated_at() SET search_path = public;
ALTER FUNCTION get_dashboard_metrics() SET search_path = public;
ALTER FUNCTION get_spend_chart_data() SET search_path = public;
ALTER FUNCTION get_platform_breakdown_data() SET search_path = public;

-- ============================================================================
-- PHASE 1.2: Harden Audit Logs Table - Enforce Immutability
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "No one can update audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Only super admins can delete audit logs" ON audit_logs;

-- Create explicit UPDATE policy (deny all updates)
CREATE POLICY "No one can update audit logs" 
ON audit_logs 
FOR UPDATE 
USING (false);

-- Create explicit DELETE policy (only super admins for retention purposes)
CREATE POLICY "Only super admins can delete audit logs" 
ON audit_logs 
FOR DELETE 
USING (is_super_admin(auth.uid()));

-- Enhanced audit log immutability trigger
DROP TRIGGER IF EXISTS prevent_audit_log_update_trigger ON audit_logs;
DROP TRIGGER IF EXISTS prevent_audit_log_delete_trigger ON audit_logs;
DROP TRIGGER IF EXISTS prevent_audit_log_changes_trigger ON audit_logs;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super admins can delete for retention purposes
  IF TG_OP = 'DELETE' THEN
    IF NOT is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only super administrators can delete audit logs. User: %, Attempted deletion of log: %', 
        auth.uid(), OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  
  -- No one can update audit logs (immutable)
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified. User: %, Attempted modification of log: %', 
      auth.uid(), OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_audit_log_changes_trigger
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_changes();

-- ============================================================================
-- PHASE 2.6: Create Extensions Schema and Prepare for Migration
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Note: Actual extension migration requires manual intervention via dashboard
-- as some extensions may have dependencies. The schema is ready for migration.

-- ============================================================================
-- VERIFICATION QUERIES (For Post-Migration Testing)
-- ============================================================================

-- Verify all SECURITY DEFINER functions now have search_path set
DO $$
DECLARE
  func_count INTEGER;
  func_without_path INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.prosecdef = true;
  
  SELECT COUNT(*) INTO func_without_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)));
  
  RAISE NOTICE 'Total SECURITY DEFINER functions: %', func_count;
  RAISE NOTICE 'Functions without search_path=public: %', func_without_path;
  
  IF func_without_path > 0 THEN
    RAISE WARNING 'Some functions still lack search_path protection!';
  ELSE
    RAISE NOTICE '✓ All SECURITY DEFINER functions are now protected';
  END IF;
END $$;