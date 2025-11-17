-- Create job group AI suggestions table
CREATE TABLE job_group_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  suggested_groups JSONB NOT NULL DEFAULT '[]',
  reasoning JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'partially_accepted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('openai', 'anthropic', 'grok'))
);

-- Create publisher performance metrics table
CREATE TABLE publisher_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  publisher_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  calculation_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_job_group_suggestions_org ON job_group_suggestions(organization_id);
CREATE INDEX idx_job_group_suggestions_campaign ON job_group_suggestions(campaign_id);
CREATE INDEX idx_job_group_suggestions_status ON job_group_suggestions(status);
CREATE INDEX idx_job_group_suggestions_expires ON job_group_suggestions(expires_at);

CREATE INDEX idx_publisher_metrics_org ON publisher_performance_metrics(organization_id);
CREATE INDEX idx_publisher_metrics_publisher ON publisher_performance_metrics(publisher_name);
CREATE INDEX idx_publisher_metrics_type ON publisher_performance_metrics(metric_type);
CREATE INDEX idx_publisher_metrics_date ON publisher_performance_metrics(calculation_date);

-- Add triggers for updated_at
CREATE TRIGGER update_job_group_suggestions_updated_at
  BEFORE UPDATE ON job_group_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publisher_metrics_updated_at
  BEFORE UPDATE ON publisher_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for job_group_suggestions
ALTER TABLE job_group_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their campaigns"
  ON job_group_suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = job_group_suggestions.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can view all suggestions in org"
  ON job_group_suggestions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization_id()
  );

CREATE POLICY "Users can update suggestions for their campaigns"
  ON job_group_suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = job_group_suggestions.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all suggestions"
  ON job_group_suggestions
  FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Service can insert suggestions"
  ON job_group_suggestions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for publisher_performance_metrics
ALTER TABLE publisher_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org metrics"
  ON publisher_performance_metrics
  FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Service can insert metrics"
  ON publisher_performance_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update metrics"
  ON publisher_performance_metrics
  FOR UPDATE
  USING (true);