-- Phase 1: Add industry_vertical column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS industry_vertical TEXT DEFAULT 'transportation';

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.industry_vertical IS 'Industry vertical for template-based configuration. Values: transportation, healthcare, cyber, trades, general';

-- Phase 1.2: Create industry_templates reference table
CREATE TABLE IF NOT EXISTS public.industry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  default_platforms JSONB DEFAULT '[]'::jsonb,
  default_features JSONB DEFAULT '[]'::jsonb,
  ai_prompt_hints JSONB DEFAULT '{}'::jsonb,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on industry_templates
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access for all authenticated users
CREATE POLICY "industry_templates_read_all" ON public.industry_templates
  FOR SELECT TO authenticated USING (true);

-- Only super admins can modify templates
CREATE POLICY "industry_templates_super_admin_all" ON public.industry_templates
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_industry_templates_updated_at
  BEFORE UPDATE ON public.industry_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 5.2: Create apply_industry_template function
CREATE OR REPLACE FUNCTION public.apply_industry_template(
  _org_id UUID,
  _vertical TEXT,
  _reset_existing BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_template RECORD;
  v_platform TEXT;
  v_feature JSONB;
BEGIN
  -- Only super admins and org admins can apply templates
  IF NOT (is_super_admin(auth.uid()) OR 
          (has_role(auth.uid(), 'admin'::app_role) AND get_user_organization_id() = _org_id)) THEN
    RAISE EXCEPTION 'Insufficient permissions to apply industry template';
  END IF;

  -- Get template configuration
  SELECT * INTO v_template
  FROM public.industry_templates
  WHERE vertical = _vertical;

  -- If no template found, use defaults based on vertical name
  IF NOT FOUND THEN
    -- Set basic defaults inline
    v_template := ROW(
      NULL::UUID,
      _vertical,
      initcap(_vertical),
      'Default template for ' || _vertical,
      '["google_jobs", "indeed"]'::jsonb,
      '[{"name": "voice_agent", "enabled": true}]'::jsonb,
      '{}'::jsonb,
      'building',
      now(),
      now()
    );
  END IF;

  -- If reset_existing, clear current platform access
  IF _reset_existing THEN
    DELETE FROM public.organization_platform_access
    WHERE organization_id = _org_id;
    
    DELETE FROM public.organization_features
    WHERE organization_id = _org_id;
  END IF;

  -- Apply platform access from template
  FOR v_platform IN SELECT jsonb_array_elements_text(v_template.default_platforms)
  LOOP
    INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
    VALUES (_org_id, v_platform, true)
    ON CONFLICT (organization_id, platform_name)
    DO UPDATE SET enabled = true, updated_at = now();
  END LOOP;

  -- Apply feature defaults from template
  FOR v_feature IN SELECT jsonb_array_elements(v_template.default_features)
  LOOP
    INSERT INTO public.organization_features (
      organization_id, 
      feature_name, 
      enabled, 
      settings
    )
    VALUES (
      _org_id,
      v_feature->>'name',
      COALESCE((v_feature->>'enabled')::boolean, true),
      COALESCE(v_feature->'settings', '{}'::jsonb)
    )
    ON CONFLICT (organization_id, feature_name)
    DO UPDATE SET 
      enabled = COALESCE((v_feature->>'enabled')::boolean, true),
      settings = COALESCE(v_feature->'settings', '{}'::jsonb),
      updated_at = now();
  END LOOP;

  -- Update organization's industry_vertical
  UPDATE public.organizations
  SET industry_vertical = _vertical, updated_at = now()
  WHERE id = _org_id;
END;
$$;

-- Phase 5.1: Update create_organization function to accept industry_vertical
CREATE OR REPLACE FUNCTION public.create_organization(
  _name TEXT, 
  _slug TEXT, 
  _admin_email TEXT DEFAULT NULL,
  _industry_vertical TEXT DEFAULT 'transportation'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Only super admins can create organizations
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can create organizations';
  END IF;

  -- Create organization with industry_vertical
  INSERT INTO public.organizations (name, slug, industry_vertical)
  VALUES (_name, _slug, _industry_vertical)
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

  -- Apply industry template defaults
  PERFORM public.apply_industry_template(v_org_id, _industry_vertical, false);

  RETURN v_org_id;
END;
$$;

-- Seed initial industry templates
INSERT INTO public.industry_templates (vertical, display_name, description, default_platforms, default_features, ai_prompt_hints, icon)
VALUES 
  (
    'transportation',
    'Transportation',
    'Trucking, logistics, and CDL driver recruitment',
    '["google_jobs", "indeed", "truck_driver_jobs_411", "newjobs4you", "road_warriors"]'::jsonb,
    '[{"name": "voice_agent", "enabled": true}, {"name": "tenstreet", "enabled": true}, {"name": "elevenlabs", "enabled": true}]'::jsonb,
    '{"industryContext": "CDL commercial driving and trucking industry", "terminology": ["CDL", "DOT", "hazmat", "tanker", "OTR", "regional", "local"], "screeningFocus": ["CDL class and endorsements", "DOT compliance history", "driving experience years", "accident and violation history"]}'::jsonb,
    'truck'
  ),
  (
    'healthcare',
    'Healthcare',
    'Medical, nursing, and healthcare professional recruitment',
    '["google_jobs", "indeed", "glassdoor"]'::jsonb,
    '[{"name": "voice_agent", "enabled": true}, {"name": "background_check", "enabled": true}, {"name": "advanced_analytics", "enabled": true}]'::jsonb,
    '{"industryContext": "Healthcare and medical professional recruitment", "terminology": ["RN", "LPN", "CNA", "NP", "PA", "licensure", "certification", "HIPAA"], "screeningFocus": ["Professional licensure verification", "Certification status", "Shift flexibility", "HIPAA compliance awareness"]}'::jsonb,
    'heart-pulse'
  ),
  (
    'cyber',
    'Cybersecurity',
    'IT security, compliance, and cyber professional recruitment',
    '["google_jobs", "indeed"]'::jsonb,
    '[{"name": "openai", "enabled": true}, {"name": "anthropic", "enabled": true}, {"name": "advanced_analytics", "enabled": true}]'::jsonb,
    '{"industryContext": "Cybersecurity and IT security professional recruitment", "terminology": ["CISSP", "CISM", "CEH", "SOC", "SIEM", "penetration testing", "compliance", "clearance"], "screeningFocus": ["Security certifications", "Clearance level", "Technical skills assessment", "Remote work capability"]}'::jsonb,
    'shield'
  ),
  (
    'trades',
    'Skilled Trades',
    'Construction, electrical, plumbing, and skilled trades recruitment',
    '["google_jobs", "indeed", "craigslist"]'::jsonb,
    '[{"name": "voice_agent", "enabled": true}, {"name": "background_check", "enabled": true}]'::jsonb,
    '{"industryContext": "Skilled trades and construction industry recruitment", "terminology": ["journeyman", "apprentice", "master", "OSHA", "union", "non-union", "license"], "screeningFocus": ["Trade certifications", "Apprenticeship completion", "Tool ownership", "Union membership status"]}'::jsonb,
    'wrench'
  ),
  (
    'general',
    'General',
    'General purpose recruitment across industries',
    '["google_jobs", "indeed"]'::jsonb,
    '[{"name": "voice_agent", "enabled": true}]'::jsonb,
    '{"industryContext": "General professional recruitment", "terminology": [], "screeningFocus": ["Work authorization", "Experience level", "Availability"]}'::jsonb,
    'building'
  )
ON CONFLICT (vertical) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_platforms = EXCLUDED.default_platforms,
  default_features = EXCLUDED.default_features,
  ai_prompt_hints = EXCLUDED.ai_prompt_hints,
  icon = EXCLUDED.icon,
  updated_at = now();