-- Phase 1: Database Schema Fixes for ATS Integration

-- 1. Update ats_systems with missing base_endpoints
UPDATE ats_systems SET base_endpoint = 'https://dashboard.tenstreet.com/post/' WHERE slug = 'tenstreet' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.driverreach.com/v1' WHERE slug = 'driverreach' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://harvest.greenhouse.io/v1' WHERE slug = 'greenhouse' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.lever.co/v1' WHERE slug = 'lever' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.icims.com/customers' WHERE slug = 'icims' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://www.workable.com/spi/v3' WHERE slug = 'workable' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.bamboohr.com/api/gateway.php' WHERE slug = 'bamboohr' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.smartrecruiters.com' WHERE slug = 'smartrecruiters' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://www.bullhornstaffing.com/rest-services' WHERE slug = 'bullhorn' AND base_endpoint IS NULL;
UPDATE ats_systems SET base_endpoint = 'https://api.jobvite.com/v2' WHERE slug = 'jobvite' AND base_endpoint IS NULL;

-- 2. Create increment_ats_sync_stats RPC function
CREATE OR REPLACE FUNCTION public.increment_ats_sync_stats(
  p_connection_id UUID,
  p_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_stats JSONB;
BEGIN
  -- Get current stats
  SELECT COALESCE(sync_stats, '{}'::jsonb) INTO current_stats
  FROM ats_connections
  WHERE id = p_connection_id;

  -- Update stats based on success/failure
  IF p_success THEN
    current_stats := jsonb_set(
      jsonb_set(
        current_stats,
        '{total_syncs}',
        to_jsonb(COALESCE((current_stats->>'total_syncs')::int, 0) + 1)
      ),
      '{successful_syncs}',
      to_jsonb(COALESCE((current_stats->>'successful_syncs')::int, 0) + 1)
    );
    current_stats := jsonb_set(current_stats, '{last_success_at}', to_jsonb(now()::text));
  ELSE
    current_stats := jsonb_set(
      jsonb_set(
        current_stats,
        '{total_syncs}',
        to_jsonb(COALESCE((current_stats->>'total_syncs')::int, 0) + 1)
      ),
      '{failed_syncs}',
      to_jsonb(COALESCE((current_stats->>'failed_syncs')::int, 0) + 1)
    );
    current_stats := jsonb_set(current_stats, '{last_failure_at}', to_jsonb(now()::text));
  END IF;

  -- Update the connection
  UPDATE ats_connections
  SET 
    sync_stats = current_stats,
    last_sync_at = now(),
    updated_at = now()
  WHERE id = p_connection_id;
END;
$$;

-- 3. Create auto_post_to_ats function for generic ATS routing
CREATE OR REPLACE FUNCTION public.get_active_ats_connections(
  p_organization_id UUID,
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE(
  connection_id UUID,
  ats_system_id UUID,
  ats_slug TEXT,
  ats_name TEXT,
  api_type TEXT,
  base_endpoint TEXT,
  credentials JSONB,
  mode TEXT,
  is_auto_post_enabled BOOLEAN,
  auto_post_on_status TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id as connection_id,
    ac.ats_system_id,
    ats.slug as ats_slug,
    ats.name as ats_name,
    ats.api_type,
    ats.base_endpoint,
    ac.credentials,
    ac.mode,
    COALESCE(ac.is_auto_post_enabled, false) as is_auto_post_enabled,
    ac.auto_post_on_status
  FROM ats_connections ac
  JOIN ats_systems ats ON ac.ats_system_id = ats.id
  WHERE ac.organization_id = p_organization_id
    AND ac.status = 'active'
    AND ats.is_active = true
    AND (p_client_id IS NULL OR ac.client_id = p_client_id OR ac.client_id IS NULL);
END;
$$;

-- 4. Add index for faster ATS connection lookups
CREATE INDEX IF NOT EXISTS idx_ats_connections_org_status 
ON ats_connections(organization_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ats_connections_auto_post 
ON ats_connections(organization_id, is_auto_post_enabled) 
WHERE is_auto_post_enabled = true;

-- 5. Add helper view for ATS sync overview
CREATE OR REPLACE VIEW ats_sync_overview AS
SELECT 
  ac.id as connection_id,
  ac.name as connection_name,
  ac.organization_id,
  o.name as organization_name,
  ats.slug as ats_slug,
  ats.name as ats_name,
  ac.status,
  ac.mode,
  ac.is_auto_post_enabled,
  ac.last_sync_at,
  ac.last_error,
  COALESCE((ac.sync_stats->>'total_syncs')::int, 0) as total_syncs,
  COALESCE((ac.sync_stats->>'successful_syncs')::int, 0) as successful_syncs,
  COALESCE((ac.sync_stats->>'failed_syncs')::int, 0) as failed_syncs,
  ac.created_at,
  ac.updated_at
FROM ats_connections ac
JOIN ats_systems ats ON ac.ats_system_id = ats.id
LEFT JOIN organizations o ON ac.organization_id = o.id;

-- Grant access to the view
GRANT SELECT ON ats_sync_overview TO authenticated;

-- 6. Create publisher feed configuration helper
CREATE OR REPLACE FUNCTION public.get_publisher_feed_config(
  p_organization_id UUID,
  p_publisher_slug TEXT
)
RETURNS TABLE(
  publisher_id UUID,
  publisher_slug TEXT,
  publisher_name TEXT,
  feed_format TEXT,
  is_enabled BOOLEAN,
  feed_url TEXT,
  api_credentials JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id as publisher_id,
    jp.slug as publisher_slug,
    jp.name as publisher_name,
    jp.feed_format,
    COALESCE(opa.is_enabled, false) as is_enabled,
    opa.feed_url,
    opa.api_credentials
  FROM job_publishers jp
  LEFT JOIN organization_publisher_access opa 
    ON jp.id = opa.publisher_id 
    AND opa.organization_id = p_organization_id
  WHERE jp.slug = p_publisher_slug
    AND jp.is_active = true;
END;
$$;