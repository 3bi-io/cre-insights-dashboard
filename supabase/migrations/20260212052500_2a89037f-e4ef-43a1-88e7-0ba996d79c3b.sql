
-- =============================================
-- Best-in-Class Platform Enhancements Migration
-- =============================================

-- 1. Add new columns to applications table
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS ats_readiness_score integer,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_status text;

-- 2. Create source_cost_config table
CREATE TABLE IF NOT EXISTS public.source_cost_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source text NOT NULL,
  monthly_cost numeric DEFAULT 0,
  cost_per_click numeric DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_source_cost_config_org_source 
  ON public.source_cost_config(organization_id, source);

-- Enable RLS
ALTER TABLE public.source_cost_config ENABLE ROW LEVEL SECURITY;

-- RLS: super admins can do everything
CREATE POLICY "Super admins full access on source_cost_config"
  ON public.source_cost_config
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- RLS: org admins can manage their own org's data
CREATE POLICY "Org admins manage own source_cost_config"
  ON public.source_cost_config
  FOR ALL
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Updated_at trigger for source_cost_config
CREATE TRIGGER update_source_cost_config_updated_at
  BEFORE UPDATE ON public.source_cost_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create trigger for first_response_at on applications
CREATE OR REPLACE FUNCTION public.set_first_response_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  -- Only set if not already set
  IF NEW.first_response_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Set first_response_at when recruiter engages
  IF (
    -- Status changed from pending
    (OLD.status = 'pending' AND NEW.status IS DISTINCT FROM OLD.status)
    -- Recruiter assigned
    OR (OLD.recruiter_id IS NULL AND NEW.recruiter_id IS NOT NULL)
    -- Notes changed (recruiter added a note)
    OR (NEW.notes IS DISTINCT FROM OLD.notes AND OLD.notes IS DISTINCT FROM NEW.notes)
  ) THEN
    NEW.first_response_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_first_response_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_first_response_at();
