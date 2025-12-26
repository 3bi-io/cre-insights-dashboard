-- Expand category check constraint to include staffing and enterprise
ALTER TABLE ats_systems DROP CONSTRAINT IF EXISTS ats_systems_category_check;
ALTER TABLE ats_systems ADD CONSTRAINT ats_systems_category_check 
  CHECK (category = ANY (ARRAY['trucking'::text, 'healthcare'::text, 'tech'::text, 'general'::text, 'hospitality'::text, 'retail'::text, 'staffing'::text, 'enterprise'::text]));

-- Add 12 additional ATS systems for multi-industry support
INSERT INTO ats_systems (name, slug, api_type, base_endpoint, category, credential_schema, field_schema, documentation_url, supports_test_mode) VALUES
  -- Enterprise & Popular
  ('SmartRecruiters', 'smartrecruiters', 'rest_json', 'https://api.smartrecruiters.com', 'general',
   '{"api_key": {"type": "password", "required": true, "label": "API Key", "description": "Your SmartRecruiters API key"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phoneNumber", "resume": "resume"}',
   'https://developers.smartrecruiters.com', true),
   
  ('Ashby', 'ashby', 'rest_json', 'https://api.ashbyhq.com', 'tech',
   '{"api_key": {"type": "password", "required": true, "label": "API Key", "description": "Your Ashby API key from Settings > Integrations"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phoneNumber", "linkedin_url": "linkedInUrl"}',
   'https://developers.ashbyhq.com', true),
   
  ('Bullhorn', 'bullhorn', 'rest_json', 'https://rest.bullhornstaffing.com/rest-services', 'staffing',
   '{"client_id": {"type": "string", "required": true, "label": "Client ID"}, "client_secret": {"type": "password", "required": true, "label": "Client Secret"}, "username": {"type": "string", "required": true, "label": "Username"}, "password": {"type": "password", "required": true, "label": "Password"}, "datacenter": {"type": "select", "required": true, "label": "Data Center", "options": ["cls2", "cls3", "cls4", "cls5", "cls21", "cls22", "cls23", "cls30", "cls31", "cls32", "cls33", "cls34"]}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phone", "address": "address"}',
   'https://bullhorn.github.io/rest-api-docs', true),
   
  ('Zoho Recruit', 'zoho-recruit', 'rest_json', 'https://recruit.zoho.com/recruit/v2', 'general',
   '{"client_id": {"type": "string", "required": true, "label": "Client ID"}, "client_secret": {"type": "password", "required": true, "label": "Client Secret"}, "refresh_token": {"type": "password", "required": true, "label": "Refresh Token"}, "datacenter": {"type": "select", "required": true, "label": "Data Center", "options": ["com", "eu", "in", "com.au", "jp"]}}',
   '{"first_name": "First_Name", "last_name": "Last_Name", "email": "Email", "phone": "Phone", "city": "City", "state": "State"}',
   'https://www.zoho.com/recruit/developer-guide', true),
   
  ('Breezy HR', 'breezyhr', 'rest_json', 'https://api.breezy.hr/v3', 'general',
   '{"api_key": {"type": "password", "required": true, "label": "API Key", "description": "Your Breezy HR API key from Settings > Integrations"}, "company_id": {"type": "string", "required": true, "label": "Company ID"}}',
   '{"first_name": "name", "email": "email_address", "phone": "phone_number", "resume": "resume"}',
   'https://developer.breezy.hr', true),

  -- Trucking & Transportation
  ('WorkN', 'workn', 'rest_json', 'https://api.workn.com/v1', 'trucking',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "company_id": {"type": "string", "required": true, "label": "Company ID"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phone", "cdl_class": "cdlClass", "years_experience": "yearsExperience"}',
   'https://workn.com/api-docs', true),

  -- Retail & Hospitality / High-Volume
  ('Fountain', 'fountain', 'rest_json', 'https://api.fountain.com/v2', 'retail',
   '{"api_key": {"type": "password", "required": true, "label": "API Key", "description": "Your Fountain API key"}, "account_id": {"type": "string", "required": true, "label": "Account ID"}}',
   '{"first_name": "first_name", "last_name": "last_name", "email": "email", "phone": "phone_number", "location": "location"}',
   'https://developer.fountain.com', true),
   
  ('Harri', 'harri', 'rest_json', 'https://api.harri.com/v1', 'hospitality',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "brand_id": {"type": "string", "required": true, "label": "Brand ID"}}',
   '{"first_name": "first_name", "last_name": "last_name", "email": "email", "phone": "phone", "availability": "availability"}',
   'https://developer.harri.com', true),
   
  ('Paradox (Olivia)', 'paradox', 'rest_json', 'https://api.paradox.ai/api/v1', 'retail',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "client_id": {"type": "string", "required": true, "label": "Client ID"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phone"}',
   'https://developer.paradox.ai', true),

  -- Healthcare
  ('HealthcareSource', 'healthcaresource', 'rest_json', 'https://api.healthcaresource.com/v1', 'healthcare',
   '{"api_key": {"type": "password", "required": true, "label": "API Key"}, "client_id": {"type": "string", "required": true, "label": "Client ID"}, "facility_id": {"type": "string", "required": false, "label": "Facility ID"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phone", "license_number": "licenseNumber", "license_state": "licenseState"}',
   'https://www.healthcaresource.com/api', true),

  -- Enterprise HCM
  ('Workday Recruiting', 'workday', 'rest_json', 'https://wd2-impl-services1.workday.com', 'enterprise',
   '{"tenant": {"type": "string", "required": true, "label": "Tenant ID"}, "client_id": {"type": "string", "required": true, "label": "Client ID"}, "client_secret": {"type": "password", "required": true, "label": "Client Secret"}, "refresh_token": {"type": "password", "required": true, "label": "Refresh Token"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "phone"}',
   'https://community.workday.com/sites/default/files/file-hosting/restapi', true),
   
  ('SAP SuccessFactors', 'successfactors', 'rest_json', 'https://api.successfactors.com/odata/v2', 'enterprise',
   '{"company_id": {"type": "string", "required": true, "label": "Company ID"}, "api_key": {"type": "password", "required": true, "label": "API Key"}, "private_key": {"type": "password", "required": false, "label": "Private Key (for OAuth)"}}',
   '{"first_name": "firstName", "last_name": "lastName", "email": "email", "phone": "cellPhone"}',
   'https://help.sap.com/docs/SAP_SUCCESSFACTORS_RECRUITING', true)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  api_type = EXCLUDED.api_type,
  base_endpoint = EXCLUDED.base_endpoint,
  category = EXCLUDED.category,
  credential_schema = EXCLUDED.credential_schema,
  field_schema = EXCLUDED.field_schema,
  documentation_url = EXCLUDED.documentation_url,
  updated_at = now();