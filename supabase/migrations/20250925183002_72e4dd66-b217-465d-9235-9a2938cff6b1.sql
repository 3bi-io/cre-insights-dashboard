-- Create assessment templates table
CREATE TABLE public.assessment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'skills', -- 'skills', 'personality', 'cultural_fit', 'video'
  questions JSONB NOT NULL DEFAULT '[]',
  scoring_criteria JSONB NOT NULL DEFAULT '{}',
  time_limit INTEGER, -- in minutes
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate assessments table
CREATE TABLE public.candidate_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  assessment_template_id UUID REFERENCES public.assessment_templates(id),
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'expired'
  responses JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate scores table
CREATE TABLE public.candidate_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  score_type TEXT NOT NULL, -- 'resume', 'assessment', 'interview', 'overall'
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence_level NUMERIC DEFAULT 0.8,
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  factors JSONB NOT NULL DEFAULT '{}', -- breakdown of scoring factors
  strengths TEXT[],
  concerns TEXT[],
  recommendations TEXT[],
  model_version TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidate rankings table
CREATE TABLE public.candidate_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  rank_position INTEGER NOT NULL,
  overall_score NUMERIC NOT NULL,
  match_percentage NUMERIC NOT NULL,
  ranking_factors JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_listing_id, application_id)
);

-- Enable RLS on all tables
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_rankings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for assessment_templates
CREATE POLICY "Users can manage their own assessment templates" 
ON public.assessment_templates 
FOR ALL 
USING (auth.uid() = user_id AND organization_id = get_user_organization_id())
WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id());

CREATE POLICY "Super admins can manage all assessment templates" 
ON public.assessment_templates 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Create RLS policies for candidate_assessments
CREATE POLICY "Users can view assessments in their org" 
ON public.candidate_assessments 
FOR SELECT 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can manage assessments for their job applications" 
ON public.candidate_assessments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.job_listings jl ON a.job_listing_id = jl.id
    WHERE a.id = candidate_assessments.application_id 
    AND jl.user_id = auth.uid()
  ) OR is_super_admin(auth.uid())
);

-- Create RLS policies for candidate_scores
CREATE POLICY "Users can view scores in their org" 
ON public.candidate_scores 
FOR SELECT 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can create scores for their applications" 
ON public.candidate_scores 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.job_listings jl ON a.job_listing_id = jl.id
    WHERE a.id = candidate_scores.application_id 
    AND jl.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own scores" 
ON public.candidate_scores 
FOR UPDATE 
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

-- Create RLS policies for candidate_rankings
CREATE POLICY "Users can view rankings in their org" 
ON public.candidate_rankings 
FOR SELECT 
USING (organization_id = get_user_organization_id() OR is_super_admin(auth.uid()));

CREATE POLICY "Users can manage rankings for their jobs" 
ON public.candidate_rankings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = candidate_rankings.job_listing_id 
    AND jl.user_id = auth.uid()
  ) OR is_super_admin(auth.uid())
);

-- Add indexes for performance
CREATE INDEX idx_assessment_templates_org_user ON public.assessment_templates(organization_id, user_id);
CREATE INDEX idx_candidate_assessments_application ON public.candidate_assessments(application_id);
CREATE INDEX idx_candidate_scores_application ON public.candidate_scores(application_id);
CREATE INDEX idx_candidate_rankings_job ON public.candidate_rankings(job_listing_id, rank_position);

-- Add updated_at triggers
CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_assessments_updated_at
  BEFORE UPDATE ON public.candidate_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_scores_updated_at
  BEFORE UPDATE ON public.candidate_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();