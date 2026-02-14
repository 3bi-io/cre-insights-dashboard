
CREATE OR REPLACE FUNCTION public.get_active_ats_connections(p_organization_id uuid, p_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(connection_id uuid, ats_system_id uuid, ats_slug text, ats_name text, api_type text, base_endpoint text, credentials jsonb, mode text, is_auto_post_enabled boolean, auto_post_on_status text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND (
      -- When client_id is provided, only return connections for that specific client
      -- (no fallback to NULL client_id connections to prevent cross-posting)
      (p_client_id IS NOT NULL AND ac.client_id = p_client_id)
      OR
      -- When no client_id filter, return all connections (org-level + all client-specific)
      (p_client_id IS NULL)
    );
END;
$function$;
