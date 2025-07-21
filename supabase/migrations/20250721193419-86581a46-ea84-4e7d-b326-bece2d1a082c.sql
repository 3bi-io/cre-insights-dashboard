-- Create table for Meta ad sets
CREATE TABLE public.meta_ad_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  status TEXT,
  targeting TEXT,
  bid_amount DECIMAL(10,2),
  daily_budget DECIMAL(10,2),
  lifetime_budget DECIMAL(10,2),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_time TIMESTAMP WITH TIME ZONE,
  updated_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, adset_id)
);

-- Create table for Meta ads
CREATE TABLE public.meta_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  status TEXT,
  creative_id TEXT,
  preview_url TEXT,
  created_time TIMESTAMP WITH TIME ZONE,
  updated_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS on Meta ad sets and ads tables
ALTER TABLE public.meta_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meta_ad_sets
CREATE POLICY "Users can manage their own Meta ad sets" 
ON public.meta_ad_sets 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for meta_ads
CREATE POLICY "Users can manage their own Meta ads" 
ON public.meta_ads 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_meta_ad_sets_user_account ON public.meta_ad_sets(user_id, account_id);
CREATE INDEX idx_meta_ad_sets_campaign ON public.meta_ad_sets(campaign_id);
CREATE INDEX idx_meta_ads_user_account ON public.meta_ads(user_id, account_id);
CREATE INDEX idx_meta_ads_campaign ON public.meta_ads(campaign_id);
CREATE INDEX idx_meta_ads_adset ON public.meta_ads(adset_id);