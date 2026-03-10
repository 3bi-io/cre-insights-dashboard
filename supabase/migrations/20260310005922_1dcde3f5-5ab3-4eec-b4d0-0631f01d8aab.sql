-- Add WhatsApp channel tracking to voice_agents
ALTER TABLE voice_agents 
  ADD COLUMN IF NOT EXISTS channels text[] NOT NULL DEFAULT ARRAY['phone']::text[];

ALTER TABLE voice_agents 
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id text DEFAULT NULL;

-- Update existing agents: inbound-only agents get phone+web
UPDATE voice_agents 
SET channels = ARRAY['phone','web']::text[]
WHERE is_outbound_enabled = false OR is_outbound_enabled IS NULL;