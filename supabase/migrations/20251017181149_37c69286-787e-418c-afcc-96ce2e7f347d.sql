-- Remove voice agent(s) for CR England organization
DELETE FROM voice_agents 
WHERE organization_id IN (
  SELECT id FROM organizations WHERE slug = 'cr-england'
);