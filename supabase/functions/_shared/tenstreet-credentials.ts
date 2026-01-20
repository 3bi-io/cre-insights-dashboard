/**
 * Tenstreet Credentials Management
 * Secure credential fetching and validation
 */

import { type TenstreetCredentials } from './tenstreet-xml-utils.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('tenstreet-credentials');

export interface CredentialFetchOptions {
  organizationId?: string;
  companyId?: string;
  userId?: string;
  userRole?: string;
}

/**
 * Fetch Tenstreet credentials from database
 * SECURITY: Only returns credentials that the user has access to
 */
export async function fetchTenstreetCredentials(
  supabaseClient: any,
  options: CredentialFetchOptions
): Promise<TenstreetCredentials | null> {
  const { organizationId, companyId, userId, userRole } = options;

  try {
    // Build query
    let query = supabaseClient
      .from('tenstreet_credentials')
      .select('*')
      .eq('status', 'active');

    // Filter by company_id if provided
    if (companyId) {
      query = query.contains('company_ids', [companyId]);
    }

    // Execute query
    const { data: credentialsList, error } = await query;

    if (error) {
      logger.error('Fetch error', error);
      throw new Error('Failed to fetch Tenstreet credentials');
    }

    if (!credentialsList || credentialsList.length === 0) {
      logger.warn('No credentials found', { companyId, organizationId });
      return null;
    }

    // Super admins can access any credentials
    if (userRole === 'super_admin') {
      return credentialsList[0] as TenstreetCredentials;
    }

    // Regular users can only access credentials from their organization
    if (organizationId) {
      const orgCredentials = credentialsList.find(
        cred => cred.organization_id === organizationId
      );
      
      if (orgCredentials) {
        return orgCredentials as TenstreetCredentials;
      }
    }

    logger.warn('No matching credentials for user', { userId, organizationId, userRole });
    return null;

  } catch (error) {
    logger.error('Credential fetch error', error);
    throw error;
  }
}

/**
 * Validate credentials have required fields
 */
export function validateCredentials(credentials: any): credentials is TenstreetCredentials {
  if (!credentials) {
    return false;
  }

  // Check required fields
  const requiredFields = ['client_id', 'password', 'mode'];
  for (const field of requiredFields) {
    if (!credentials[field]) {
      logger.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Check company_ids or company_id
  if (!credentials.company_ids && !credentials.company_id) {
    logger.error('Missing company_id or company_ids');
    return false;
  }

  // Validate mode
  if (!['DEV', 'TEST', 'PROD'].includes(credentials.mode)) {
    logger.error(`Invalid mode: ${credentials.mode}`);
    return false;
  }

  return true;
}

/**
 * Mask credentials for logging (remove sensitive data)
 */
export function maskCredentialsForLog(credentials: TenstreetCredentials): any {
  return {
    client_id: credentials.client_id,
    password: '***[REDACTED]***',
    mode: credentials.mode,
    company_ids: credentials.company_ids,
    account_name: credentials.account_name || 'Unknown'
  };
}
