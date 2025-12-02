-- =====================================================
-- Phase 1: Fix Feature Naming - Handle Duplicates First
-- =====================================================

-- Delete old-named features where the new name already exists (keep the standardized ones)
DELETE FROM public.organization_features 
WHERE feature_name = 'xai_grok_access' 
  AND organization_id IN (
    SELECT organization_id FROM public.organization_features WHERE feature_name = 'grok_access'
  );

DELETE FROM public.organization_features 
WHERE feature_name = 'tenstreet_integration' 
  AND organization_id IN (
    SELECT organization_id FROM public.organization_features WHERE feature_name = 'tenstreet_access'
  );

DELETE FROM public.organization_features 
WHERE feature_name = 'elevenlabs_voice' 
  AND organization_id IN (
    SELECT organization_id FROM public.organization_features WHERE feature_name = 'elevenlabs_access'
  );

-- Now rename remaining old-named features to standardized names
UPDATE public.organization_features 
SET feature_name = 'grok_access' 
WHERE feature_name = 'xai_grok_access';

UPDATE public.organization_features 
SET feature_name = 'tenstreet_access' 
WHERE feature_name = 'tenstreet_integration';

UPDATE public.organization_features 
SET feature_name = 'elevenlabs_access' 
WHERE feature_name = 'elevenlabs_voice';

-- =====================================================
-- Phase 2: Sync All Features to All Organizations
-- =====================================================

INSERT INTO public.organization_features (organization_id, feature_name, enabled)
SELECT o.id, f.feature_name, true
FROM public.organizations o
CROSS JOIN (VALUES 
  ('meta_integration'),
  ('openai_access'),
  ('anthropic_access'),
  ('grok_access'),
  ('tenstreet_access'),
  ('voice_agent'),
  ('elevenlabs_access'),
  ('advanced_analytics')
) AS f(feature_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_features of
  WHERE of.organization_id = o.id AND of.feature_name = f.feature_name
)
ON CONFLICT (organization_id, feature_name) DO NOTHING;

-- =====================================================
-- Phase 3: Fix Platform Naming
-- =====================================================

DELETE FROM public.organization_platform_access 
WHERE platform_name = 'google_jobs';

-- =====================================================
-- Phase 4: Sync All Platforms to All Organizations
-- =====================================================

INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
SELECT o.id, p.platform_name, true
FROM public.organizations o
CROSS JOIN (VALUES 
  ('google-jobs'),
  ('indeed'),
  ('simplyhired'),
  ('meta'),
  ('craigslist'),
  ('glassdoor'),
  ('truck-driver-jobs-411'),
  ('newjobs4you'),
  ('roadwarriors'),
  ('ats_explorer'),
  ('import_applications')
) AS p(platform_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_platform_access opa
  WHERE opa.organization_id = o.id AND opa.platform_name = p.platform_name
)
ON CONFLICT (organization_id, platform_name) DO NOTHING;

-- =====================================================
-- Phase 5: Fix Clients RLS Policy
-- =====================================================

DROP POLICY IF EXISTS "Users can view clients in org" ON public.clients;