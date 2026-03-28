CREATE OR REPLACE FUNCTION public.get_public_voice_agent_client_ids(_org_ids uuid[])
RETURNS TABLE(organization_id uuid, client_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT va.organization_id, va.client_id
  FROM public.voice_agents va
  WHERE va.organization_id = ANY(_org_ids)
    AND va.is_active = true
    AND va.client_id IS NOT NULL;
$$;