-- Set up standard organization features for ACME
INSERT INTO public.organization_features (organization_id, feature_name, enabled, settings)
VALUES 
  ('98f13347-333c-4f51-a162-015c2d61590f', 'advanced_analytics', true, '{}'),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'anthropic_access', true, '{}'),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'meta_integration', true, '{}'),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'openai_access', true, '{}'),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'tenstreet_access', true, '{}'),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'voice_agent', true, '{}')
ON CONFLICT (organization_id, feature_name) DO NOTHING;

-- Set up platform access for ACME (enable all standard platforms)
INSERT INTO public.organization_platform_access (organization_id, platform_name, enabled)
VALUES 
  ('98f13347-333c-4f51-a162-015c2d61590f', 'indeed', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'google-jobs', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'craigslist', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'simplyhired', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'glassdoor', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'truck-driver-jobs-411', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'newjobs4you', true),
  ('98f13347-333c-4f51-a162-015c2d61590f', 'roadwarriors', true)
ON CONFLICT (organization_id, platform_name) DO NOTHING;