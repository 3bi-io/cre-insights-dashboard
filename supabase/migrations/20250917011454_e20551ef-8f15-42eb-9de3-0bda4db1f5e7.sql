-- Update Meta account ID from old (435031743763874) to new (1594827328159714)
-- This preserves historical data while switching to the new Meta account

-- Update meta_ad_accounts table
UPDATE meta_ad_accounts 
SET account_id = '1594827328159714' 
WHERE account_id = '435031743763874';

-- Update meta_campaigns table
UPDATE meta_campaigns 
SET account_id = '1594827328159714' 
WHERE account_id = '435031743763874';

-- Update meta_ad_sets table  
UPDATE meta_ad_sets 
SET account_id = '1594827328159714' 
WHERE account_id = '435031743763874';

-- Update meta_ads table
UPDATE meta_ads 
SET account_id = '1594827328159714' 
WHERE account_id = '435031743763874';

-- Update meta_daily_spend table
UPDATE meta_daily_spend 
SET account_id = '1594827328159714' 
WHERE account_id = '435031743763874';