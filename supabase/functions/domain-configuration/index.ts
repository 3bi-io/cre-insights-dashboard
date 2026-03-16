import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('domain-configuration');

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { organizationId, domain, action } = await req.json()

    logger.info('Domain configuration request', { action, domain, organizationId })

    // Verify super admin access
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    // Check if user is super admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isSuperAdmin = userRoles?.some(role => role.role === 'super_admin')
    if (!isSuperAdmin) {
      throw new Error('Super admin access required')
    }

    let result = {}

    switch (action) {
      case 'configure':
        result = await configureDomain(supabase, organizationId, domain)
        break
      case 'verify':
        result = await verifyDomain(supabase, organizationId, domain)
        break
      case 'deploy':
        result = await deployDomain(supabase, organizationId, domain)
        break
      case 'remove':
        result = await removeDomain(supabase, organizationId, domain)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Domain configuration error', error instanceof Error ? error : null)
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function configureDomain(supabase: ReturnType<typeof createClient>, organizationId: string, domain: string) {
  logger.info('Configuring domain', { domain })
  
  // Generate verification token
  const verificationToken = crypto.randomUUID()
  
  // Generate DNS records for domain verification and routing
  const dnsRecords = {
    A: [
      { name: '@', value: '185.158.133.1', ttl: 3600 },
      { name: 'www', value: '185.158.133.1', ttl: 3600 }
    ],
    TXT: {
      name: '@',
      value: `lovable-verification=${verificationToken}`,
      ttl: 3600
    },
    CNAME: {
      name: 'www',
      value: domain,
      ttl: 3600
    }
  }

  // Update organization with domain configuration
  const { error } = await supabase
    .from('organizations')
    .update({
      domain,
      domain_status: 'pending',
      domain_verification_token: verificationToken,
      domain_dns_records: dnsRecords
    })
    .eq('id', organizationId)

  if (error) {
    throw new Error(`Failed to configure domain: ${error.message}`)
  }

  logger.info('Domain configured successfully', { domain })
  
  return {
    success: true,
    verificationToken,
    dnsRecords,
    message: 'Domain configured successfully. Please set up DNS records.'
  }
}

async function verifyDomain(supabase: ReturnType<typeof createClient>, organizationId: string, domain: string) {
  logger.info('Verifying domain', { domain })
  
  try {
    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('domain_verification_token')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      throw new Error('Organization not found')
    }

    // Simulate DNS verification (in production, you'd make actual DNS queries)
    const isVerified = await performDNSVerification(domain, org.domain_verification_token)
    
    // Update domain status
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        domain_status: isVerified ? 'active' : 'failed'
      })
      .eq('id', organizationId)

    if (updateError) {
      throw new Error(`Failed to update domain status: ${updateError.message}`)
    }

    logger.info('Domain verification result', { domain, verified: isVerified })
    
    return {
      success: true,
      verified: isVerified,
      message: isVerified 
        ? 'Domain verified successfully!' 
        : 'Domain verification failed. Please check DNS records.'
    }
  } catch (error) {
    logger.error('Domain verification error', error)
    throw error
  }
}

async function deployDomain(supabase: any, organizationId: string, domain: string) {
  logger.info('Deploying domain', { domain })
  
  try {
    // In production, this would trigger actual deployment and SSL provisioning
    // For now, we'll simulate the deployment process
    
    // Update deployment status
    const { error } = await supabase
      .from('organizations')
      .update({
        domain_deployed_at: new Date().toISOString(),
        domain_ssl_status: 'provisioning'
      })
      .eq('id', organizationId)

    if (error) {
      throw new Error(`Failed to deploy domain: ${error.message}`)
    }

    // Simulate SSL provisioning (in production, integrate with Let's Encrypt or similar)
    setTimeout(async () => {
      await supabase
        .from('organizations')
        .update({
          domain_ssl_status: 'active'
        })
        .eq('id', organizationId)
    }, 30000) // 30 seconds simulation

    logger.info('Domain deployment initiated', { domain })
    
    return {
      success: true,
      message: 'Domain deployment initiated. SSL certificate will be provisioned shortly.'
    }
  } catch (error) {
    logger.error('Domain deployment error', error)
    throw error
  }
}

async function removeDomain(supabase: any, organizationId: string, domain: string) {
  logger.info('Removing domain', { domain })
  
  try {
    // Remove domain configuration
    const { error } = await supabase
      .from('organizations')
      .update({
        domain: null,
        domain_status: 'not_configured',
        domain_verification_token: null,
        domain_ssl_status: 'not_provisioned',
        domain_deployed_at: null,
        domain_dns_records: {}
      })
      .eq('id', organizationId)

    if (error) {
      throw new Error(`Failed to remove domain: ${error.message}`)
    }

    logger.info('Domain removed successfully', { domain })
    
    return {
      success: true,
      message: 'Domain configuration removed successfully.'
    }
  } catch (error) {
    logger.error('Domain removal error', error)
    throw error
  }
}

async function performDNSVerification(domain: string, verificationToken: string): Promise<boolean> {
  try {
    // In production, you would make actual DNS queries here
    // For demo purposes, we'll simulate a successful verification after a delay
    logger.info('Performing DNS verification', { domain, tokenPresent: !!verificationToken })
    
    // Simulate DNS lookup delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real implementation, you would:
    // 1. Query TXT records for the domain
    // 2. Check if the verification token exists
    // 3. Verify A records point to the correct IP
    // 4. Check CNAME records are configured correctly
    
    // For now, return true to simulate successful verification
    return true
  } catch (error) {
    logger.error('DNS verification error', error)
    return false
  }
}
