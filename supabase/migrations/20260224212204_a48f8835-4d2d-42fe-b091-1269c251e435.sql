-- Insert webhook record for Career Now Brands
INSERT INTO public.client_webhooks (organization_id, webhook_url, user_id, client_id, enabled, event_types)
VALUES (
  '650cf2cc-22e7-4a52-8899-b56d315bed2a',
  'https://hooks.zapier.com/hooks/catch/23823129/u28navp/',
  '313592ee-ac3b-4c7c-b5b4-fe95c46e62d9',
  NULL,
  true,
  ARRAY['created']
);

-- Set screening questions for Career Now Brands
UPDATE public.organizations
SET screening_questions = '[
  {
    "id": "valid_cdl",
    "question": "Do you currently hold an active Class A CDL license?",
    "type": "select",
    "required": true,
    "options": [
      {"value": "yes", "label": "Yes"},
      {"value": "no", "label": "No", "is_correct": false}
    ]
  },
  {
    "id": "experience",
    "question": "How many years of Class A CDL driving experience do you have?",
    "type": "select",
    "required": true,
    "options": [
      {"value": "0", "label": "No Experience"},
      {"value": "3", "label": "3+ Months"},
      {"value": "6", "label": "6+ Months"},
      {"value": "12", "label": "At least 1 year"},
      {"value": "24", "label": "2 years or more"}
    ]
  }
]'::jsonb
WHERE id = '650cf2cc-22e7-4a52-8899-b56d315bed2a';