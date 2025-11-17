-- Create campaign AI analysis cache table
CREATE TABLE campaign_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('performance', 'optimization', 'prediction', 'publisher_comparison')),
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('openai', 'anthropic', 'grok')),
  insights JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_campaign_ai_analysis_campaign ON campaign_ai_analysis(campaign_id);
CREATE INDEX idx_campaign_ai_analysis_org ON campaign_ai_analysis(organization_id);
CREATE INDEX idx_campaign_ai_analysis_type ON campaign_ai_analysis(analysis_type);
CREATE INDEX idx_campaign_ai_analysis_expires ON campaign_ai_analysis(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_ai_analysis_updated_at
  BEFORE UPDATE ON campaign_ai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE campaign_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Users can view AI analysis for their campaigns
CREATE POLICY "Users can view AI analysis for their campaigns"
  ON campaign_ai_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_ai_analysis.campaign_id
      AND c.user_id = auth.uid()
    )
  );

-- Org admins can view all AI analysis in their org
CREATE POLICY "Org admins can view all AI analysis in org"
  ON campaign_ai_analysis
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization_id()
  );

-- Super admins can view all AI analysis
CREATE POLICY "Super admins can view all AI analysis"
  ON campaign_ai_analysis
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Service role can insert AI analysis
CREATE POLICY "Service can insert AI analysis"
  ON campaign_ai_analysis
  FOR INSERT
  WITH CHECK (true);