-- Backfill incomplete "Direct Application" records to correct source
-- These are external integrations that claimed Direct Application without proper screening data

UPDATE public.applications 
SET 
  source = 'External Webhook (Backfilled)',
  notes = COALESCE(notes, '') || E'\n\n--- Data Quality Note ---\nOriginal source was "Direct Application" but missing screening fields (cdl, drug, consent). Corrected to External Webhook on ' || NOW()::text
WHERE 
  source = 'Direct Application'
  AND (cdl IS NULL OR drug IS NULL OR consent IS NULL)
  AND created_at > NOW() - INTERVAL '90 days';