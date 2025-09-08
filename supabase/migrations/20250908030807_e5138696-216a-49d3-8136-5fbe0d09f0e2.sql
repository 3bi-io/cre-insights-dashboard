-- Create organization features table
CREATE TABLE IF NOT EXISTS public.organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;

-- Create policies for organization features
CREATE POLICY "Super admins can manage all org features" 
ON public.organization_features 
FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their org features" 
ON public.organization_features 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id()
);

-- Functions for organization management
CREATE OR REPLACE FUNCTION public.create_organization(
  _name TEXT,
  _slug TEXT,
  _admin_email TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Only super admins can create organizations
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can create organizations';
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, slug)
  VALUES (_name, _slug)
  RETURNING id INTO v_org_id;

  -- If admin email provided, create admin user
  IF _admin_email IS NOT NULL THEN
    -- Find user by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = _admin_email LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
      -- Update profile with organization
      UPDATE public.profiles 
      SET organization_id = v_org_id 
      WHERE id = v_user_id;
      
      -- Grant admin role
      INSERT INTO public.user_roles (user_id, role, organization_id)
      VALUES (v_user_id, 'admin'::app_role, v_org_id)
      ON CONFLICT (user_id, role) DO UPDATE SET organization_id = v_org_id;
    END IF;
  END IF;

  RETURN v_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_organization_features(
  _org_id UUID,
  _features JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  feature_record RECORD;
BEGIN
  -- Only super admins can update org features
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can update organization features';
  END IF;

  -- Loop through features and upsert
  FOR feature_record IN 
    SELECT key AS feature_name, value::jsonb AS feature_data
    FROM jsonb_each(_features)
  LOOP
    INSERT INTO public.organization_features (
      organization_id, 
      feature_name, 
      enabled, 
      settings
    )
    VALUES (
      _org_id,
      feature_record.feature_name,
      (feature_record.feature_data->>'enabled')::boolean,
      COALESCE(feature_record.feature_data->'settings', '{}')
    )
    ON CONFLICT (organization_id, feature_name)
    DO UPDATE SET
      enabled = (feature_record.feature_data->>'enabled')::boolean,
      settings = COALESCE(feature_record.feature_data->'settings', '{}'),
      updated_at = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_with_stats(_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  user_count INTEGER;
  job_count INTEGER;
  app_count INTEGER;
  monthly_spend NUMERIC := 0;
BEGIN
  -- Only super admins and org admins can view org stats
  IF NOT (is_super_admin(auth.uid()) OR 
          (has_role(auth.uid(), 'admin'::app_role) AND get_user_organization_id() = _org_id)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Get basic org info
  SELECT to_jsonb(o.*) INTO result
  FROM public.organizations o
  WHERE o.id = _org_id;

  IF result IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get user count
  SELECT COUNT(*) INTO user_count
  FROM public.profiles
  WHERE organization_id = _org_id;

  -- Get job count
  SELECT COUNT(*) INTO job_count
  FROM public.job_listings
  WHERE organization_id = _org_id AND status = 'active';

  -- Get application count
  SELECT COUNT(*) INTO app_count
  FROM public.applications a
  JOIN public.job_listings j ON a.job_listing_id = j.id
  WHERE j.organization_id = _org_id;

  -- Get monthly spend
  SELECT COALESCE(SUM(spend), 0) INTO monthly_spend
  FROM public.meta_daily_spend
  WHERE organization_id = _org_id
  AND date_start >= date_trunc('month', CURRENT_DATE);

  -- Add stats to result
  result := result || jsonb_build_object(
    'user_count', user_count,
    'job_count', job_count,
    'application_count', app_count,
    'monthly_spend', monthly_spend
  );

  RETURN result;
END;
$$;

-- Trigger for updating timestamps
CREATE TRIGGER update_organization_features_updated_at
  BEFORE UPDATE ON public.organization_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default features for existing organizations
INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'meta_integration', true
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'openai_access', false
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'anthropic_access', false
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'tenstreet_access', false
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'voice_agent', false
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT id, 'advanced_analytics', false
FROM public.organizations
ON CONFLICT (organization_id, feature_name) DO NOTHING;