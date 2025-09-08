-- Update RLS policies for job_listings to ensure super admins can view all
DROP POLICY IF EXISTS "Super admins can view all job listings" ON public.job_listings;

CREATE POLICY "Super admins can view all job listings" 
ON public.job_listings 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Update RLS policies for applications to ensure super admins can view all
DROP POLICY IF EXISTS "Super admins can view all applications" ON public.applications;

CREATE POLICY "Super admins can view all applications" 
ON public.applications 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Also allow super admins to update applications across all organizations
CREATE POLICY "Super admins can update all applications" 
ON public.applications 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

-- Allow super admins to update job listings across all organizations
CREATE POLICY "Super admins can update all job listings" 
ON public.job_listings 
FOR UPDATE 
USING (is_super_admin(auth.uid()));