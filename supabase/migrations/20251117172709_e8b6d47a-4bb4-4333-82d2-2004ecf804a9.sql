-- Fix client_webhooks INSERT policy to properly validate organization membership
DROP POLICY IF EXISTS "Users can create webhooks in their org" ON client_webhooks;

CREATE POLICY "Users can create webhooks in their org" 
ON client_webhooks 
FOR INSERT 
TO public 
WITH CHECK (
  organization_id = get_user_organization_id() 
  AND user_id = auth.uid()
);