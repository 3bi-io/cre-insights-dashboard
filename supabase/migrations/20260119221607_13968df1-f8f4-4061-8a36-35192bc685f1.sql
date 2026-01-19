-- Update all CR-England organization ATS connections with TheDriverBoardLead source
UPDATE ats_connections
SET credentials = credentials || '{"source": "TheDriverBoardLead"}'::jsonb
WHERE organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749';