-- Add domain management fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS domain_status text DEFAULT 'not_configured',
ADD COLUMN IF NOT EXISTS domain_verification_token text,
ADD COLUMN IF NOT EXISTS domain_ssl_status text DEFAULT 'not_provisioned',
ADD COLUMN IF NOT EXISTS domain_deployed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS domain_dns_records jsonb DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN public.organizations.domain_status IS 'Status: not_configured, pending, active, failed, expired';
COMMENT ON COLUMN public.organizations.domain_verification_token IS 'Token used for domain verification';
COMMENT ON COLUMN public.organizations.domain_ssl_status IS 'SSL status: not_provisioned, provisioning, active, failed';
COMMENT ON COLUMN public.organizations.domain_dns_records IS 'Required DNS records for domain setup';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_domain_status ON public.organizations(domain_status);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain) WHERE domain IS NOT NULL;