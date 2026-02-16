
-- Add scheduled_at column to outbound_calls
ALTER TABLE public.outbound_calls
ADD COLUMN scheduled_at timestamptz;

-- Backfill from metadata where available
UPDATE public.outbound_calls
SET scheduled_at = (metadata->>'scheduled_at')::timestamptz
WHERE metadata->>'scheduled_at' IS NOT NULL;
