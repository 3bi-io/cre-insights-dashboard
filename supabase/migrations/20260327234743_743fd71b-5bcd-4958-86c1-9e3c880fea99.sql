-- Upgrade AspenView voice agents from gpt-4o-mini to gpt-4o for better technical screening
UPDATE voice_agents 
SET llm_model = 'gpt-4o'
WHERE organization_id = '9335c64c-b793-4578-bf51-63d0c3b5d66d'
  AND llm_model = 'gpt-4o-mini';