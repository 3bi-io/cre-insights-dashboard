-- Add unique constraint for meta_ad_sets to enable proper upserts
ALTER TABLE meta_ad_sets ADD CONSTRAINT meta_ad_sets_unique_adset UNIQUE (user_id, account_id, adset_id);

-- Add additional metrics fields to meta_ad_sets table
ALTER TABLE meta_ad_sets 
ADD COLUMN IF NOT EXISTS spend NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpm NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpc NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS frequency NUMERIC DEFAULT 0;