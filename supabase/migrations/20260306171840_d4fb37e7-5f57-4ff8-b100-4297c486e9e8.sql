-- Re-categorize all AspenView jobs from Driver Recruitment to Cybersecurity
UPDATE public.job_listings
SET category_id = '73e6a938-8502-4cda-a889-c7ff69a7b474',
    updated_at = now()
WHERE client_id = '82513316-7df2-4bf0-83d8-6c511c83ddfb'
  AND category_id = '61bd5f79-b3c1-4804-a6a0-d568773c3d84';

-- Fix truncated "Remoto (Bogotá" → "Bogotá (Remote)"
UPDATE public.job_listings
SET location = CASE
  WHEN location LIKE 'Remoto (%' AND location NOT LIKE '%)' THEN
    regexp_replace(location, '^Remoto \(', '') || ' (Remote)'
  WHEN location LIKE 'Remoto (%' AND location LIKE '%)' THEN
    regexp_replace(regexp_replace(location, '^Remoto \(', ''), '\)$', '') || ' (Remote)'
  WHEN location = 'Remoto' THEN 'Remote'
  ELSE location
END,
remote_type = CASE
  WHEN location ILIKE '%remoto%' OR location ILIKE '%remote%' THEN 'remote'
  ELSE COALESCE(remote_type, 'on-site')
END,
updated_at = now()
WHERE client_id = '82513316-7df2-4bf0-83d8-6c511c83ddfb'
  AND (location ILIKE '%remoto%' OR location ILIKE '%remote%');

-- Add cyber-specific screening questions to Aspen Analytics org
UPDATE public.organizations
SET screening_questions = '[
  {
    "id": "security_clearance",
    "question": "What is your current security clearance level?",
    "type": "select",
    "required": true,
    "options": [
      {"value": "none", "label": "None"},
      {"value": "public_trust", "label": "Public Trust"},
      {"value": "secret", "label": "Secret"},
      {"value": "top_secret", "label": "Top Secret"},
      {"value": "ts_sci", "label": "Top Secret / SCI"}
    ]
  },
  {
    "id": "certifications",
    "question": "Which cybersecurity certifications do you hold?",
    "type": "select",
    "required": false,
    "options": [
      {"value": "none", "label": "None"},
      {"value": "comptia_sec", "label": "CompTIA Security+"},
      {"value": "cissp", "label": "CISSP"},
      {"value": "cism", "label": "CISM"},
      {"value": "ceh", "label": "CEH"},
      {"value": "other", "label": "Other"}
    ]
  },
  {
    "id": "remote_capability",
    "question": "Are you able to work remotely with a secure home office setup?",
    "type": "select",
    "required": true,
    "options": [
      {"value": "yes", "label": "Yes"},
      {"value": "no", "label": "No"},
      {"value": "can_setup", "label": "Can set up if needed"}
    ]
  }
]'::jsonb,
updated_at = now()
WHERE id = '9335c64c-b793-4578-bf51-63d0c3b5d66d';