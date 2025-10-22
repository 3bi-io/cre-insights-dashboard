-- Update organizations with active subscriptions
UPDATE public.organizations
SET 
  subscription_status = 'active',
  updated_at = NOW()
WHERE slug IN ('hayes-recruiting-solutions', 'garmon-media', 'acquireroi', 'cr-england');