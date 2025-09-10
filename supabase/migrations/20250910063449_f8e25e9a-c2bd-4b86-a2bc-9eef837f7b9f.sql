-- Create job_groups table for organizing jobs within campaigns
CREATE TABLE public.job_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  publisher_name TEXT NOT NULL,
  publisher_endpoint TEXT,
  xml_feed_settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active'::text CHECK (status IN ('active', 'inactive', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  organization_id UUID DEFAULT get_user_organization_id()
);

-- Create job_group_assignments table to link jobs to job groups
CREATE TABLE public.job_group_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_group_id UUID NOT NULL,
  job_listing_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_group_id, job_listing_id)
);

-- Enable RLS on job_groups
ALTER TABLE public.job_groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_groups
CREATE POLICY "Users can manage their own job groups"
ON public.job_groups
FOR ALL
USING ((auth.uid() = user_id) AND (organization_id = get_user_organization_id()))
WITH CHECK ((auth.uid() = user_id) AND (organization_id = get_user_organization_id()));

CREATE POLICY "Super admins can manage all job groups"
ON public.job_groups
FOR ALL
USING (is_super_admin(auth.uid()));

-- Enable RLS on job_group_assignments
ALTER TABLE public.job_group_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_group_assignments
CREATE POLICY "Users can manage assignments for their job groups"
ON public.job_group_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.job_groups jg
  WHERE jg.id = job_group_assignments.job_group_id
  AND jg.user_id = auth.uid()
));

-- Add trigger for updated_at on job_groups
CREATE TRIGGER update_job_groups_updated_at
  BEFORE UPDATE ON public.job_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_job_groups_campaign_id ON public.job_groups(campaign_id);
CREATE INDEX idx_job_groups_user_id ON public.job_groups(user_id);
CREATE INDEX idx_job_groups_organization_id ON public.job_groups(organization_id);
CREATE INDEX idx_job_group_assignments_job_group_id ON public.job_group_assignments(job_group_id);
CREATE INDEX idx_job_group_assignments_job_listing_id ON public.job_group_assignments(job_listing_id);