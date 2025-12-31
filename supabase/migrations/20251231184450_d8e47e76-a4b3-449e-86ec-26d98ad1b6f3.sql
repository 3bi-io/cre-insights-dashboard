-- Update has_active_subscription function to always return true
-- Subscription checks have been removed from the pricing model
CREATE OR REPLACE FUNCTION public.has_active_subscription(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;  -- Always return true, subscription not required
$$;