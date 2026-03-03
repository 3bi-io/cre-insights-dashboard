
-- Add allowed_origins column to org_api_keys for dynamic CORS management
ALTER TABLE public.org_api_keys 
ADD COLUMN allowed_origins TEXT[] DEFAULT '{}';

-- Add rate_limit_per_minute column for per-key rate limiting
ALTER TABLE public.org_api_keys 
ADD COLUMN rate_limit_per_minute INTEGER DEFAULT 100;

-- Create API request logs table for rate limiting tracking
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.org_api_keys(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  origin TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for rate limiting lookups (recent requests per key)
CREATE INDEX idx_api_request_logs_key_time ON public.api_request_logs (api_key_id, created_at DESC);

-- Index for analytics
CREATE INDEX idx_api_request_logs_org_time ON public.api_request_logs (organization_id, created_at DESC);

-- Auto-cleanup old logs (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_request_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_request_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Enable RLS
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- Only service role should access these (edge function uses service key)
-- Org admins can view their own logs via the dashboard
CREATE POLICY "Org admins can view their API logs"
ON public.api_request_logs
FOR SELECT
USING (
  organization_id = public.get_user_organization_id()
  AND (
    public.is_super_admin(auth.uid()) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);
