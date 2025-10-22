-- Enable all features for all existing organizations
DO $$
DECLARE
  org RECORD;
  features_json JSONB;
BEGIN
  -- Build the features JSON with all features enabled
  features_json := jsonb_build_object(
    'meta_integration', jsonb_build_object('enabled', true),
    'openai_access', jsonb_build_object('enabled', true),
    'anthropic_access', jsonb_build_object('enabled', true),
    'xai_grok_access', jsonb_build_object('enabled', true),
    'voice_agent', jsonb_build_object('enabled', true),
    'elevenlabs_voice', jsonb_build_object('enabled', true),
    'tenstreet_integration', jsonb_build_object('enabled', true),
    'advanced_analytics', jsonb_build_object('enabled', true)
  );

  -- Loop through all organizations and enable all features
  FOR org IN SELECT id FROM public.organizations
  LOOP
    -- Insert or update all features for this organization
    INSERT INTO public.organization_features (organization_id, feature_name, enabled)
    VALUES 
      (org.id, 'meta_integration', true),
      (org.id, 'openai_access', true),
      (org.id, 'anthropic_access', true),
      (org.id, 'xai_grok_access', true),
      (org.id, 'voice_agent', true),
      (org.id, 'elevenlabs_voice', true),
      (org.id, 'tenstreet_integration', true),
      (org.id, 'advanced_analytics', true)
    ON CONFLICT (organization_id, feature_name)
    DO UPDATE SET 
      enabled = true,
      updated_at = now();

    -- Insert or update all platforms for this organization
    INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
    VALUES
      (org.id, 'google_jobs', true),
      (org.id, 'indeed', true),
      (org.id, 'simplyhired', true),
      (org.id, 'meta', true),
      (org.id, 'craigslist', true),
      (org.id, 'glassdoor', true)
    ON CONFLICT (organization_id, platform_name)
    DO UPDATE SET
      enabled = true,
      updated_at = now();
  END LOOP;
END $$;