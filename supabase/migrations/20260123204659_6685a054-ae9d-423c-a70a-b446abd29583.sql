-- =============================================
-- PART 1: Voice Agents Security - Fix RLS Policies
-- =============================================

-- Remove the permissive public policy that exposes all agents
DROP POLICY IF EXISTS "Public can view voice agents for active jobs" ON public.voice_agents;

-- Remove any duplicate/overlapping SELECT policies to clean up
DROP POLICY IF EXISTS "Users can view voice agents in their org" ON public.voice_agents;

-- Create a single, clean SELECT policy for authenticated users only
CREATE POLICY "Users can view voice agents in their org" ON public.voice_agents
FOR SELECT TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    organization_id = get_user_organization_id()
    AND auth.uid() IS NOT NULL
  )
);

-- =============================================
-- PART 2: Hidden Job Listings - Add is_hidden column
-- =============================================

-- Add is_hidden column to job_listings table
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Create partial index for efficient filtering of visible jobs
CREATE INDEX IF NOT EXISTS idx_job_listings_is_hidden 
ON public.job_listings(is_hidden) 
WHERE is_hidden = false;

-- Mark existing General Application listings as hidden
UPDATE public.job_listings 
SET is_hidden = true 
WHERE title ILIKE 'General Application%';

-- Add comment for documentation
COMMENT ON COLUMN public.job_listings.is_hidden IS 
  'Hidden listings are active but not visible to public visitors (e.g., General Applications)';