-- Fix: Remove overly permissive public SELECT policy on organizations
-- This exposes sensitive subscription_status, settings, domain DNS info to public

-- Step 1: Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;

-- Step 2: Check if public_organization_info view exists, drop if it does (we'll recreate it)
DROP VIEW IF EXISTS public.public_organization_info CASCADE;

-- Step 3: Create a secure public view with ONLY safe public fields
-- This allows job boards and public pages to still access basic org info
CREATE VIEW public.public_organization_info AS
SELECT 
  id,
  name,
  slug,
  logo_url
FROM public.organizations;

-- Step 4: Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_organization_info TO anon;
GRANT SELECT ON public.public_organization_info TO authenticated;

-- Step 5: Add comment explaining purpose
COMMENT ON VIEW public.public_organization_info IS 'Public-safe organization info for job boards. Excludes subscription_status, settings, domain, dns records, plan_type, and other sensitive business data.';