-- Create universal feed configurations table
CREATE TABLE IF NOT EXISTS universal_feed_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  feed_name TEXT NOT NULL,
  feed_format TEXT NOT NULL DEFAULT 'generic',
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_org_client_format UNIQUE(organization_id, client_id, feed_format),
  CONSTRAINT valid_feed_format CHECK (feed_format IN ('indeed', 'google', 'generic'))
);

-- Enable RLS
ALTER TABLE universal_feed_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage their org's feed configs"
  ON universal_feed_configs
  FOR ALL
  USING (
    organization_id = get_user_organization_id() 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    organization_id = get_user_organization_id() 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Super admins can manage all feed configs"
  ON universal_feed_configs
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_feed_configs_org_client ON universal_feed_configs(organization_id, client_id);
CREATE INDEX idx_feed_configs_active ON universal_feed_configs(is_active) WHERE is_active = true;

-- Update timestamp trigger
CREATE TRIGGER update_universal_feed_configs_updated_at
  BEFORE UPDATE ON universal_feed_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add format column to feed_access_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feed_access_logs' AND column_name = 'format'
  ) THEN
    ALTER TABLE feed_access_logs ADD COLUMN format TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feed_access_logs' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE feed_access_logs ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feed_access_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE feed_access_logs ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;