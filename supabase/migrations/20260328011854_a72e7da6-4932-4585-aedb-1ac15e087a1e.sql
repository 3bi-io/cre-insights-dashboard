-- Insert client-specific inbound voice agent records for R.E. Garrison, Novco, and Sysco
-- elevenlabs_agent_id left NULL to avoid unique constraint; the shared org-level agent handles actual calls

INSERT INTO public.voice_agents (organization_id, client_id, agent_name, agent_id, description, is_active, channels)
VALUES 
  ('84214b48-7b51-45bc-ad7f-723bcf50466c', 'be8b645e-d480-4c22-8e75-b09a7fc1db7a', 'R.E. Garrison Inbound Agent', 'garrison-inbound', 'Inbound voice agent for R.E. Garrison Trucking', true, ARRAY['web']),
  ('84214b48-7b51-45bc-ad7f-723bcf50466c', '4a9ef1df-dcc9-499c-999a-446bb9a329fc', 'Novco Inbound Agent', 'novco-inbound', 'Inbound voice agent for Novco, Inc.', true, ARRAY['web']),
  ('682af95c-e95a-4e21-8753-ddef7f8c1749', 'e2619f0a-f111-4f6e-9c23-c5c618528b4a', 'Sysco Inbound Agent', 'sysco-inbound', 'Inbound voice agent for Sysco', true, ARRAY['web']);