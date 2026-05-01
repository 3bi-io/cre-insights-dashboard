ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applyai_webhook_status text,
  ADD COLUMN IF NOT EXISTS applyai_webhook_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS applyai_webhook_last_error text;

CREATE INDEX IF NOT EXISTS idx_applications_applyai_webhook_status
  ON public.applications (applyai_webhook_status)
  WHERE applyai_webhook_status IS DISTINCT FROM 'sent';