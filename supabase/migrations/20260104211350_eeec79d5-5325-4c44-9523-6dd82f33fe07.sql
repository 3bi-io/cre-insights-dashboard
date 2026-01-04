-- Fix remaining SECURITY DEFINER views by recreating with SECURITY INVOKER

-- Drop and recreate ats_sync_overview view
DROP VIEW IF EXISTS ats_sync_overview;
CREATE VIEW ats_sync_overview WITH (security_invoker = true) AS
SELECT 
    ac.id AS connection_id,
    ac.name AS connection_name,
    ac.organization_id,
    o.name AS organization_name,
    ats.slug AS ats_slug,
    ats.name AS ats_name,
    ac.status,
    ac.mode,
    ac.is_auto_post_enabled,
    ac.last_sync_at,
    ac.last_error,
    COALESCE((ac.sync_stats ->> 'total_syncs'::text)::integer, 0) AS total_syncs,
    COALESCE((ac.sync_stats ->> 'successful_syncs'::text)::integer, 0) AS successful_syncs,
    COALESCE((ac.sync_stats ->> 'failed_syncs'::text)::integer, 0) AS failed_syncs,
    ac.created_at,
    ac.updated_at
FROM ats_connections ac
JOIN ats_systems ats ON ac.ats_system_id = ats.id
LEFT JOIN organizations o ON ac.organization_id = o.id;

-- Drop and recreate public_organization_info view
DROP VIEW IF EXISTS public_organization_info;
CREATE VIEW public_organization_info WITH (security_invoker = true) AS
SELECT 
    organizations.id,
    organizations.name,
    organizations.slug,
    organizations.logo_url
FROM organizations;