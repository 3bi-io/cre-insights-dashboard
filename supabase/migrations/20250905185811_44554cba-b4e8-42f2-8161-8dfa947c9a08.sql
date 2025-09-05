-- Add a column to store incoming call transcripts from ElevenLabs on applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS elevenlabs_call_transcript text;

COMMENT ON COLUMN public.applications.elevenlabs_call_transcript IS 'Stores incoming call transcripts from ElevenLabs incoming calls.';