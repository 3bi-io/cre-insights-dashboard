-- Create AI performance metrics tracking table
CREATE TABLE IF NOT EXISTS public.ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Time to hire metrics
  ai_avg_time_to_hire_hours NUMERIC,
  traditional_avg_time_to_hire_hours NUMERIC,
  
  -- Quality metrics
  ai_avg_quality_score NUMERIC,
  traditional_avg_quality_score NUMERIC,
  
  -- Cost metrics
  ai_avg_cost_per_hire NUMERIC,
  traditional_avg_cost_per_hire NUMERIC,
  
  -- Volume metrics
  ai_applications_processed INTEGER DEFAULT 0,
  traditional_applications_processed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, metric_date)
);

-- Create AI interaction logs table
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  interaction_type TEXT NOT NULL, -- 'candidate_scoring', 'application_screening', 'chat_interaction'
  ai_provider TEXT, -- 'openai', 'anthropic', 'basic'
  
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  -- Metadata
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AI decision tracking table
CREATE TABLE IF NOT EXISTS public.ai_decision_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  used_ai BOOLEAN NOT NULL DEFAULT false,
  decision_type TEXT NOT NULL, -- 'screening', 'scoring', 'ranking'
  ai_provider TEXT, -- 'openai', 'anthropic', 'basic', null for traditional
  
  -- Outcome tracking
  time_to_decision_minutes INTEGER,
  quality_score NUMERIC,
  hire_outcome TEXT, -- 'hired', 'rejected', 'pending', 'withdrawn'
  hire_outcome_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_ai_performance_metrics_org_date ON public.ai_performance_metrics(organization_id, metric_date DESC);
CREATE INDEX idx_ai_interaction_logs_org_created ON public.ai_interaction_logs(organization_id, created_at DESC);
CREATE INDEX idx_ai_interaction_logs_type ON public.ai_interaction_logs(interaction_type, created_at DESC);
CREATE INDEX idx_ai_decision_tracking_app ON public.ai_decision_tracking(application_id);
CREATE INDEX idx_ai_decision_tracking_org_created ON public.ai_decision_tracking(organization_id, created_at DESC);
CREATE INDEX idx_ai_decision_tracking_used_ai ON public.ai_decision_tracking(used_ai, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_performance_metrics
CREATE POLICY "Users can view their org's AI performance metrics"
  ON public.ai_performance_metrics FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "System can insert AI performance metrics"
  ON public.ai_performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update AI performance metrics"
  ON public.ai_performance_metrics FOR UPDATE
  USING (true);

-- RLS Policies for ai_interaction_logs
CREATE POLICY "Users can view their org's AI interaction logs"
  ON public.ai_interaction_logs FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "System can insert AI interaction logs"
  ON public.ai_interaction_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_decision_tracking
CREATE POLICY "Users can view their org's AI decision tracking"
  ON public.ai_decision_tracking FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "System can insert AI decision tracking"
  ON public.ai_decision_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update AI decision tracking"
  ON public.ai_decision_tracking FOR UPDATE
  USING (true);

-- Create function to update ai_performance_metrics updated_at
CREATE OR REPLACE FUNCTION update_ai_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_performance_metrics_updated_at
  BEFORE UPDATE ON public.ai_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_performance_metrics_updated_at();

-- Create function to update ai_decision_tracking updated_at
CREATE OR REPLACE FUNCTION update_ai_decision_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_decision_tracking_updated_at
  BEFORE UPDATE ON public.ai_decision_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_decision_tracking_updated_at();