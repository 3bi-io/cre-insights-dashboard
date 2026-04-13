
-- Insert Church Transportation field configuration
-- Client ID: dffb0ef4-07a0-494f-9790-ef9868e143c7
-- Organization ID: 84214b48-7b51-45bc-ad7f-723bcf50466c

INSERT INTO public.client_application_fields (client_id, organization_id, field_key, enabled, required)
VALUES
  -- Required fields (enabled=true, required=true)
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'dateOfBirth', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'ssn', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'address1', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'experience', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'cdlClass', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'medicalCardExpiration', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'accidentHistory', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'violationHistory', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'employers', true, true),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'convictedFelony', true, true),
  -- Disabled fields (enabled=false)
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'canWorkWeekends', false, false),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'canWorkNights', false, false),
  ('dffb0ef4-07a0-494f-9790-ef9868e143c7', '84214b48-7b51-45bc-ad7f-723bcf50466c', 'experienceLowOptions', false, false)
ON CONFLICT (client_id, field_key) DO UPDATE
  SET enabled = EXCLUDED.enabled,
      required = EXCLUDED.required;
