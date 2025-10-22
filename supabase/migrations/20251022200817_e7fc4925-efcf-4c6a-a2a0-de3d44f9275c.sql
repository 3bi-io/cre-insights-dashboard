-- Update organizations table default subscription status to inactive
ALTER TABLE public.organizations 
ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- Create function to check if organization has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
      AND subscription_status IN ('active', 'trialing')
  )
$$;

-- Update RLS policies for job_listings to enforce subscription
DROP POLICY IF EXISTS "Users can create their own job listings" ON public.job_listings;
CREATE POLICY "Users can create their own job listings" 
ON public.job_listings 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_active_subscription(organization_id)
  )
);

DROP POLICY IF EXISTS "Users can update their own job listings" ON public.job_listings;
CREATE POLICY "Users can update their own job listings" 
ON public.job_listings 
FOR UPDATE 
USING (
  (auth.uid() = user_id) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_active_subscription(organization_id)
  )
);

-- Update applications policies to ensure organization subscription is active
DROP POLICY IF EXISTS "Users can create applications for their job listings" ON public.applications;
CREATE POLICY "Users can create applications for their job listings" 
ON public.applications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM job_listings
    WHERE job_listings.id = applications.job_listing_id
      AND job_listings.user_id = auth.uid()
      AND (
        is_super_admin(auth.uid())
        OR has_active_subscription(job_listings.organization_id)
      )
  )
);