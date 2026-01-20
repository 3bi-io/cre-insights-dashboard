-- Phase 7: Monetization Preparation - Usage Tracking Infrastructure

-- Create organization_usage table for tracking metered actions
CREATE TABLE IF NOT EXISTS public.organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Job metrics
  jobs_posted INTEGER DEFAULT 0,
  jobs_active INTEGER DEFAULT 0,
  
  -- Application metrics
  applications_received INTEGER DEFAULT 0,
  applications_processed INTEGER DEFAULT 0,
  
  -- AI usage metrics
  ai_screenings_performed INTEGER DEFAULT 0,
  ai_analytics_queries INTEGER DEFAULT 0,
  voice_agent_minutes DECIMAL(10,2) DEFAULT 0,
  
  -- Integration metrics
  ats_syncs_performed INTEGER DEFAULT 0,
  webhook_calls_made INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint for org + period
  UNIQUE(organization_id, period_start)
);

-- Enable RLS
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Org admins can view their own usage
CREATE POLICY "Org admins can view their usage"
  ON public.organization_usage
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can view all usage
CREATE POLICY "Super admins can view all usage"
  ON public.organization_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service can manage usage"
  ON public.organization_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for efficient lookups
CREATE INDEX idx_org_usage_org_period ON public.organization_usage(organization_id, period_start);

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_organization_id UUID,
  p_metric TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Current month period
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Upsert usage record
  INSERT INTO public.organization_usage (
    organization_id, period_start, period_end
  ) VALUES (
    p_organization_id, v_period_start, v_period_end
  )
  ON CONFLICT (organization_id, period_start) DO NOTHING;
  
  -- Update the specific metric
  EXECUTE format(
    'UPDATE public.organization_usage SET %I = COALESCE(%I, 0) + $1, updated_at = now() 
     WHERE organization_id = $2 AND period_start = $3',
    p_metric, p_metric
  ) USING p_amount, p_organization_id, v_period_start;
END;
$$;

-- Add feature tier column to organizations (for future use)
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Add usage limits column (JSONB for flexibility)
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS usage_limits JSONB DEFAULT '{
    "jobs_limit": 5,
    "applications_limit": 100,
    "ai_screenings_limit": 50,
    "voice_minutes_limit": 30
  }'::JSONB;

-- Function to check if usage limit is exceeded
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_organization_id UUID,
  p_metric TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_usage INTEGER;
  v_limit INTEGER;
  v_period_start DATE;
BEGIN
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  
  -- Get current usage
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM public.organization_usage 
     WHERE organization_id = $1 AND period_start = $2',
    p_metric
  ) INTO v_current_usage USING p_organization_id, v_period_start;
  
  -- Get limit from organization
  SELECT (usage_limits->>($1 || '_limit'))::INTEGER INTO v_limit
  FROM public.organizations WHERE id = p_organization_id;
  
  -- If no limit set, allow unlimited
  IF v_limit IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN COALESCE(v_current_usage, 0) >= v_limit;
END;
$$;