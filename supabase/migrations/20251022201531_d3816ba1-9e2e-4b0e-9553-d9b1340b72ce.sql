-- Permanently assign Professional Plan access to demo@testuser.com
-- Their organization (ACME) is already active, ensuring it stays active

UPDATE public.organizations
SET subscription_status = 'active'
WHERE id = '98f13347-333c-4f51-a162-015c2d61590f';

-- Add a comment to track this is a permanent demo account
COMMENT ON COLUMN public.organizations.subscription_status IS 
'Subscription status: inactive, trialing, active, past_due, canceled. Demo account (demo@testuser.com org: ACME) has permanent active status.';