-- Add plan_type column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'enterprise';

-- Update all existing organizations to Enterprise plan with active subscription
UPDATE public.organizations 
SET 
  plan_type = 'enterprise',
  subscription_status = 'active'
WHERE plan_type IS NULL OR subscription_status != 'active';

-- Add check constraint for valid plan types
ALTER TABLE public.organizations
ADD CONSTRAINT organizations_plan_type_check 
CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise'));

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.plan_type IS 'Organization subscription plan type: free, starter, professional, or enterprise';

-- Update settings for unlimited enterprise features (optional)
UPDATE public.organizations
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'user_limit', null,
  'job_limit', null,
  'features', jsonb_build_object(
    'unlimited_users', true,
    'unlimited_jobs', true,
    'priority_support', true,
    'custom_branding', true,
    'advanced_analytics', true,
    'api_access', true
  )
)
WHERE plan_type = 'enterprise';