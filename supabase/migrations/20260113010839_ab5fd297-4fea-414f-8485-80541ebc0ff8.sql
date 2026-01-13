-- Phase 1: Unified Activity Timeline - Database Schema

-- Create candidate_activities table for tracking all candidate interactions
CREATE TABLE public.candidate_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'status_change', 'note_added', 'email_sent', 'sms_sent', 'call_made', 
    'document_uploaded', 'screening_initiated', 'ats_synced', 'application_created',
    'recruiter_assigned', 'interview_scheduled', 'offer_sent', 'background_check'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_candidate_activities_application_id ON public.candidate_activities(application_id);
CREATE INDEX idx_candidate_activities_organization_id ON public.candidate_activities(organization_id);
CREATE INDEX idx_candidate_activities_created_at ON public.candidate_activities(created_at DESC);
CREATE INDEX idx_candidate_activities_type ON public.candidate_activities(activity_type);

-- Enable RLS
ALTER TABLE public.candidate_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Organization-scoped access
CREATE POLICY "Users can view activities in their organization"
ON public.candidate_activities
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Users can create activities in their organization"
ON public.candidate_activities
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_organization_id()
  OR is_super_admin(auth.uid())
);

-- Trigger to auto-log application status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get organization_id from the job_listing
  SELECT jl.organization_id INTO org_id
  FROM public.job_listings jl
  WHERE jl.id = NEW.job_listing_id;

  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status AND org_id IS NOT NULL THEN
    INSERT INTO public.candidate_activities (
      application_id,
      organization_id,
      user_id,
      activity_type,
      title,
      description,
      metadata
    ) VALUES (
      NEW.id,
      org_id,
      auth.uid(),
      'status_change',
      'Status changed to ' || COALESCE(NEW.status, 'pending'),
      'Application status updated from ' || COALESCE(OLD.status, 'none') || ' to ' || COALESCE(NEW.status, 'pending'),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to applications table
CREATE TRIGGER trigger_log_application_status_change
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION log_application_status_change();

-- Trigger to log new application creation
CREATE OR REPLACE FUNCTION log_application_created()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  applicant_name TEXT;
BEGIN
  -- Get organization_id from the job_listing
  SELECT jl.organization_id INTO org_id
  FROM public.job_listings jl
  WHERE jl.id = NEW.job_listing_id;

  -- Build applicant name
  applicant_name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
  
  IF org_id IS NOT NULL THEN
    INSERT INTO public.candidate_activities (
      application_id,
      organization_id,
      user_id,
      activity_type,
      title,
      description,
      metadata
    ) VALUES (
      NEW.id,
      org_id,
      NULL,
      'application_created',
      'Application submitted',
      TRIM(applicant_name) || ' submitted an application',
      jsonb_build_object(
        'source', NEW.source,
        'applicant_email', NEW.applicant_email
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger for new applications
CREATE TRIGGER trigger_log_application_created
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION log_application_created();