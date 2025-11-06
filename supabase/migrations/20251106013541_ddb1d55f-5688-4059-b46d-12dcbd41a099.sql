-- Create table for Xchange verification requests (background checks, MVR, drug tests, etc.)
CREATE TABLE tenstreet_xchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'MVR', 'DrugTest', 'EmploymentVerification', 'CriminalBackground'
  provider TEXT, -- 'TheWorkNumber', 'FirstAdvantage', 'LabCorp', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  result_data JSONB, -- Stores verification results
  cost_cents INTEGER DEFAULT 0, -- Cost of the verification in cents
  reference_number TEXT, -- External provider reference
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_xchange_application ON tenstreet_xchange_requests(application_id);
CREATE INDEX idx_xchange_driver ON tenstreet_xchange_requests(driver_id);
CREATE INDEX idx_xchange_org ON tenstreet_xchange_requests(organization_id);
CREATE INDEX idx_xchange_status ON tenstreet_xchange_requests(status);
CREATE INDEX idx_xchange_type ON tenstreet_xchange_requests(request_type);

-- Enable Row Level Security
ALTER TABLE tenstreet_xchange_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super admins can see all requests
CREATE POLICY "Super admins can view all xchange requests"
  ON tenstreet_xchange_requests
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- RLS Policy: Org admins can see their organization's requests
CREATE POLICY "Org admins can view their organization xchange requests"
  ON tenstreet_xchange_requests
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = get_user_organization_id()
  );

-- RLS Policy: Recruiters can see requests for applications they're assigned to
CREATE POLICY "Recruiters can view assigned xchange requests"
  ON tenstreet_xchange_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN recruiters r ON a.recruiter_id = r.id
      WHERE a.id = tenstreet_xchange_requests.application_id
      AND r.user_id = auth.uid()
    )
  );

-- RLS Policy: Job owners can see requests for their job applications
CREATE POLICY "Job owners can view their job xchange requests"
  ON tenstreet_xchange_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = tenstreet_xchange_requests.application_id
      AND jl.user_id = auth.uid()
    )
  );

-- RLS Policy: Super admins can insert requests
CREATE POLICY "Super admins can create xchange requests"
  ON tenstreet_xchange_requests
  FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policy: Org admins can insert requests for their org
CREATE POLICY "Org admins can create xchange requests"
  ON tenstreet_xchange_requests
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization_id()
  );

-- RLS Policy: Super admins can update all requests
CREATE POLICY "Super admins can update xchange requests"
  ON tenstreet_xchange_requests
  FOR UPDATE
  USING (is_super_admin(auth.uid()));

-- RLS Policy: Org admins can update their organization's requests
CREATE POLICY "Org admins can update their xchange requests"
  ON tenstreet_xchange_requests
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization_id()
  );

-- RLS Policy: Only super admins can delete requests
CREATE POLICY "Super admins can delete xchange requests"
  ON tenstreet_xchange_requests
  FOR DELETE
  USING (is_super_admin(auth.uid()));

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_xchange_requests_updated_at
  BEFORE UPDATE ON tenstreet_xchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get xchange requests for an application with cost summary
CREATE OR REPLACE FUNCTION get_application_xchange_summary(app_id UUID)
RETURNS TABLE(
  total_requests INTEGER,
  pending_requests INTEGER,
  completed_requests INTEGER,
  total_cost_cents INTEGER,
  latest_request_date TIMESTAMPTZ
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress'))::INTEGER as pending_requests,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_requests,
    COALESCE(SUM(cost_cents), 0)::INTEGER as total_cost_cents,
    MAX(request_date) as latest_request_date
  FROM tenstreet_xchange_requests
  WHERE application_id = app_id;
$$;