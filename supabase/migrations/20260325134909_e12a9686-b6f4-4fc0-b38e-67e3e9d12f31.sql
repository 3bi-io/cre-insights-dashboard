INSERT INTO ats_systems (
  slug, name, api_type, base_endpoint, category, is_active, supports_test_mode,
  credential_schema, field_schema, documentation_url
) VALUES (
  'doublenickel',
  'Double Nickel',
  'rest_json',
  'https://dashboard.getdoublenickel.com/api/applicants',
  'trucking',
  true,
  true,
  '{"client_id": {"label": "Auth0 Client ID", "type": "string", "required": true, "placeholder": "Your Auth0 client_id"}, "client_secret": {"label": "Auth0 Client Secret", "type": "password", "required": true, "placeholder": "Your Auth0 client_secret"}, "audience": {"label": "Auth0 Audience", "type": "string", "required": true, "placeholder": "e.g. https://api.getdoublenickel.com"}, "companyId": {"label": "Company ID", "type": "string", "required": true, "placeholder": "Your Double Nickel Company ID"}, "trackingLinkId": {"label": "Tracking Link ID", "type": "string", "required": true, "placeholder": "Tracking link for attribution"}}'::jsonb,
  '{}'::jsonb,
  'https://getdoublenickel.com'
) ON CONFLICT (slug) DO NOTHING;