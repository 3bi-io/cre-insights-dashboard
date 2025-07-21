
-- Create table for Meta ad accounts
CREATE TABLE public.meta_ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT,
  currency TEXT DEFAULT 'USD',
  timezone_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Create table for Meta campaigns
CREATE TABLE public.meta_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  objective TEXT,
  status TEXT,
  created_time TIMESTAMP WITH TIME ZONE,
  updated_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Create table for Meta daily spend data
CREATE TABLE public.meta_daily_spend (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  frequency DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id, date_start, COALESCE(campaign_id, ''), COALESCE(adset_id, ''), COALESCE(ad_id, ''))
);

-- Enable RLS on all Meta tables
ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_daily_spend ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meta_ad_accounts
CREATE POLICY "Users can manage their own Meta ad accounts" 
ON public.meta_ad_accounts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for meta_campaigns
CREATE POLICY "Users can manage their own Meta campaigns" 
ON public.meta_campaigns 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for meta_daily_spend
CREATE POLICY "Users can manage their own Meta spend data" 
ON public.meta_daily_spend 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_meta_daily_spend_user_date ON public.meta_daily_spend(user_id, date_start);
CREATE INDEX idx_meta_daily_spend_account ON public.meta_daily_spend(account_id, date_start);
CREATE INDEX idx_meta_campaigns_user ON public.meta_campaigns(user_id, account_id);
