-- Allow authenticated users to read their organization's features
CREATE POLICY "Users can read their org features"
ON public.organization_features
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());