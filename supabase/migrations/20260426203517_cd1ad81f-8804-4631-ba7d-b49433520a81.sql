-- Add columns to scheduled_callbacks for richer scheduling workflow
ALTER TABLE public.scheduled_callbacks
  ADD COLUMN IF NOT EXISTS driver_email text,
  ADD COLUMN IF NOT EXISTS reschedule_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS conference_url text,
  ADD COLUMN IF NOT EXISTS previous_event_ids text[] NOT NULL DEFAULT '{}';

-- Reminders queue table
CREATE TABLE IF NOT EXISTS public.scheduling_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  callback_id uuid NOT NULL REFERENCES public.scheduled_callbacks(id) ON DELETE CASCADE,
  fire_at timestamptz NOT NULL,
  kind text NOT NULL CHECK (kind IN ('driver_1h','recruiter_15m')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduling_reminders_due
  ON public.scheduling_reminders (status, fire_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduling_reminders_callback
  ON public.scheduling_reminders (callback_id);

-- RLS: only service role writes; recruiters can read their own
ALTER TABLE public.scheduling_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters view own reminders" ON public.scheduling_reminders;
CREATE POLICY "Recruiters view own reminders"
  ON public.scheduling_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_callbacks sc
      WHERE sc.id = scheduling_reminders.callback_id
        AND sc.recruiter_user_id = auth.uid()
    )
  );