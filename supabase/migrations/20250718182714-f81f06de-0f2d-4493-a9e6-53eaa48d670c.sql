
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_job_assignments table to associate jobs with campaigns
CREATE TABLE public.campaign_job_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, job_listing_id)
);

-- Add campaign_id to budget_allocations table
ALTER TABLE public.budget_allocations 
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Add campaign_id to daily_spend table (through job_listing relationship)
-- No direct change needed as daily_spend connects to campaigns through job_listings -> campaign_job_assignments

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_job_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can view their own campaigns" ON public.campaigns 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON public.campaigns 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for campaign_job_assignments
CREATE POLICY "Users can view assignments for their campaigns" ON public.campaign_job_assignments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create assignments for their campaigns" ON public.campaign_job_assignments 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_listing_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update assignments for their campaigns" ON public.campaign_job_assignments 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete assignments for their campaigns" ON public.campaign_job_assignments 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
  );

-- Create updated_at trigger for campaigns
CREATE TRIGGER handle_campaigns_updated_at 
  BEFORE UPDATE ON public.campaigns 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
