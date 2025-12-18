-- Add RLS policy for anonymous page_views SELECT access (for analytics)
-- This matches the existing visitor_sessions anonymous access policy
CREATE POLICY "Allow anonymous page view reading for analytics"
ON public.page_views
FOR SELECT
USING (true);