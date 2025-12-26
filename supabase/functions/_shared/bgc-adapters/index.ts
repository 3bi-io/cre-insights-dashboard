/**
 * Background Check Adapters Index
 * Factory function and exports for all BGC provider integrations
 */

import { BaseBGCAdapter } from './base-adapter.ts';
import { CheckrAdapter } from './checkr-adapter.ts';
import { SterlingAdapter } from './sterling-adapter.ts';
import { HireRightAdapter } from './hireright-adapter.ts';
import { GoodHireAdapter } from './goodhire-adapter.ts';
import { AccurateAdapter } from './accurate-adapter.ts';
import { 
  BGCAdapterConfig, 
  BGCProvider, 
  BGCConnection,
  BGCRequest,
  BGCResponse,
  BGCReport,
  CandidateData,
  CheckType,
} from './types.ts';

// Re-export types
export * from './types.ts';
export { BaseBGCAdapter } from './base-adapter.ts';
export { CheckrAdapter } from './checkr-adapter.ts';
export { SterlingAdapter } from './sterling-adapter.ts';
export { HireRightAdapter } from './hireright-adapter.ts';
export { GoodHireAdapter } from './goodhire-adapter.ts';
export { AccurateAdapter } from './accurate-adapter.ts';

/**
 * Factory function to create the appropriate BGC adapter
 */
export function createBGCAdapter(config: BGCAdapterConfig): BaseBGCAdapter {
  const { provider } = config;
  
  switch (provider.slug) {
    case 'checkr':
      return new CheckrAdapter(config);
    case 'sterling':
      return new SterlingAdapter(config);
    case 'hireright':
      return new HireRightAdapter(config);
    case 'goodhire':
      return new GoodHireAdapter(config);
    case 'accurate':
      return new AccurateAdapter(config);
    default:
      throw new Error(`Unsupported BGC provider: ${provider.slug}`);
  }
}

/**
 * Get list of supported providers
 */
export function getSupportedProviders(): string[] {
  return ['checkr', 'sterling', 'hireright', 'goodhire', 'accurate'];
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(slug: string): boolean {
  return getSupportedProviders().includes(slug);
}

/**
 * Initiate a background check using the specified provider
 */
export async function initiateBackgroundCheck(
  provider: BGCProvider,
  connection: BGCConnection,
  request: BGCRequest,
  correlationId?: string
): Promise<BGCResponse> {
  const config: BGCAdapterConfig = {
    provider,
    connection,
    correlationId,
  };
  
  const adapter = createBGCAdapter(config);
  return adapter.initiateCheck(request);
}

/**
 * Get status of a background check
 */
export async function getBackgroundCheckStatus(
  provider: BGCProvider,
  connection: BGCConnection,
  externalId: string,
  correlationId?: string
): Promise<BGCResponse> {
  const config: BGCAdapterConfig = {
    provider,
    connection,
    correlationId,
  };
  
  const adapter = createBGCAdapter(config);
  return adapter.getStatus(externalId);
}

/**
 * Get full report for a background check
 */
export async function getBackgroundCheckReport(
  provider: BGCProvider,
  connection: BGCConnection,
  externalId: string,
  correlationId?: string
): Promise<BGCReport> {
  const config: BGCAdapterConfig = {
    provider,
    connection,
    correlationId,
  };
  
  const adapter = createBGCAdapter(config);
  return adapter.getReport(externalId);
}

/**
 * Test connection credentials for a provider
 */
export async function testBGCConnection(
  provider: BGCProvider,
  connection: BGCConnection,
  correlationId?: string
): Promise<BGCResponse> {
  const config: BGCAdapterConfig = {
    provider,
    connection,
    correlationId,
  };
  
  const adapter = createBGCAdapter(config);
  return adapter.testConnection();
}

/**
 * Validate and parse a webhook payload
 */
export function validateBGCWebhook(
  providerSlug: string,
  payload: string,
  signature: string,
  secret: string,
  provider: BGCProvider,
  connection: BGCConnection
) {
  const config: BGCAdapterConfig = {
    provider,
    connection,
  };
  
  const adapter = createBGCAdapter(config);
  return adapter.validateWebhook(payload, signature, secret);
}

/**
 * Map application data to candidate data format
 */
export function mapApplicationToCandidate(application: Record<string, unknown>): CandidateData {
  return {
    first_name: (application.first_name as string) || '',
    last_name: (application.last_name as string) || '',
    email: (application.applicant_email as string) || '',
    middle_name: application.middle_name as string,
    date_of_birth: application.date_of_birth as string,
    ssn: application.ssn as string,
    phone: application.phone as string,
    address_line1: application.address_1 as string,
    address_line2: application.address_2 as string,
    city: application.city as string,
    state: application.state as string,
    zip: application.zip as string,
    country: (application.country as string) || 'US',
    driver_license_number: application.driver_license_number as string,
    driver_license_state: application.cdl_state as string,
    consent_given: true,
    application_id: application.id as string,
  };
}

/**
 * Get default check types based on application type
 */
export function getDefaultCheckTypes(
  hasDriverLicense: boolean,
  hasSSN: boolean
): CheckType[] {
  const checks: CheckType[] = ['criminal'];
  
  if (hasSSN) {
    checks.push('ssn_trace');
  }
  
  if (hasDriverLicense) {
    checks.push('mvr');
  }
  
  return checks;
}
