-- Create social_beacon_configurations table for platform settings
CREATE TABLE public.social_beacon_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('x', 'facebook', 'instagram', 'whatsapp', 'tiktok', 'reddit')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- OAuth Configuration
  oauth_client_id TEXT,
  oauth_redirect_uri TEXT,
  oauth_scopes TEXT[],
  
  -- Webhook Configuration  
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_verified_at TIMESTAMPTZ,
  
  -- Feature Flags
  auto_engage_enabled BOOLEAN DEFAULT false,
  ad_creative_enabled BOOLEAN DEFAULT false,
  
  -- Platform-specific settings stored as JSONB
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(platform, organization_id)
);

-- Create generated_ad_creatives table for storing AI-generated ads
CREATE TABLE public.generated_ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Configuration used to generate
  job_type TEXT NOT NULL,
  benefits TEXT[] NOT NULL DEFAULT '{}',
  
  -- Generated content
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('ai_image', 'ai_video', 'upload')),
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Distribution tracking
  platforms_published TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.social_beacon_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_ad_creatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_beacon_configurations
-- Super admins can manage all configs (including global ones where org_id IS NULL)
CREATE POLICY "Super admins manage all beacon configs"
  ON public.social_beacon_configurations
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Org admins can manage their organization's configs
CREATE POLICY "Org admins manage their beacon configs"
  ON public.social_beacon_configurations
  FOR ALL
  USING (
    organization_id IS NOT NULL 
    AND organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for generated_ad_creatives
CREATE POLICY "Super admins manage all ad creatives"
  ON public.generated_ad_creatives
  FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins manage their ad creatives"
  ON public.generated_ad_creatives
  FOR ALL
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can view their org ad creatives"
  ON public.generated_ad_creatives
  FOR SELECT
  USING (organization_id = public.get_user_organization_id());

-- Create updated_at triggers
CREATE TRIGGER update_social_beacon_configurations_updated_at
  BEFORE UPDATE ON public.social_beacon_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_ad_creatives_updated_at
  BEFORE UPDATE ON public.generated_ad_creatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_social_beacon_configs_platform ON public.social_beacon_configurations(platform);
CREATE INDEX idx_social_beacon_configs_org ON public.social_beacon_configurations(organization_id);
CREATE INDEX idx_generated_ad_creatives_org ON public.generated_ad_creatives(organization_id);
CREATE INDEX idx_generated_ad_creatives_job_type ON public.generated_ad_creatives(job_type);