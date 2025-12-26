/**
 * ATS Adapter Factory
 * Creates the appropriate adapter based on ATS system type
 */

import { BaseATSAdapter } from './base-adapter.ts';
import { XMLPostAdapter } from './xml-post-adapter.ts';
import { RESTJSONAdapter } from './rest-json-adapter.ts';
import type { AdapterConfig, ATSSystem, ATSConnection, FieldMapping } from './types.ts';

// Re-export types
export * from './types.ts';
export { BaseATSAdapter } from './base-adapter.ts';
export { XMLPostAdapter } from './xml-post-adapter.ts';
export { RESTJSONAdapter } from './rest-json-adapter.ts';

/**
 * Create an ATS adapter based on the system configuration
 */
export function createATSAdapter(
  system: ATSSystem,
  connection: ATSConnection,
  fieldMapping?: FieldMapping
): BaseATSAdapter {
  const config: AdapterConfig = {
    system,
    connection,
    fieldMapping,
  };

  switch (system.api_type) {
    case 'xml_post':
    case 'soap':
      return new XMLPostAdapter(config);
    
    case 'rest_json':
    case 'graphql':
      return new RESTJSONAdapter(config);
    
    case 'webhook':
      // Webhooks are outbound-only, use REST adapter
      return new RESTJSONAdapter(config);
    
    default:
      throw new Error(`Unsupported API type: ${system.api_type}`);
  }
}

/**
 * Get adapter for a specific ATS by slug
 */
export function getAdapterBySlug(
  slug: string,
  connection: ATSConnection,
  fieldMapping?: FieldMapping
): BaseATSAdapter {
  // Map known slugs to their configurations
  const systemConfigs: Record<string, Partial<ATSSystem>> = {
    // Trucking
    tenstreet: {
      api_type: 'xml_post',
      base_endpoint: 'https://xchange.tenstreet.com/post/',
      category: 'trucking',
    },
    driverreach: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.driverreach.com/v1',
      category: 'trucking',
    },
    workn: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.workn.com/v1',
      category: 'trucking',
    },
    
    // General
    greenhouse: {
      api_type: 'rest_json',
      base_endpoint: 'https://harvest.greenhouse.io/v1',
      category: 'general',
    },
    lever: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.lever.co/v1',
      category: 'tech',
    },
    workable: {
      api_type: 'rest_json',
      category: 'general',
    },
    jazzhr: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.resumatorapi.com/v1',
      category: 'general',
    },
    bamboohr: {
      api_type: 'rest_json',
      category: 'general',
    },
    icims: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.icims.com',
      category: 'general',
    },
    smartrecruiters: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.smartrecruiters.com',
      category: 'general',
    },
    ashby: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.ashbyhq.com',
      category: 'tech',
    },
    'zoho-recruit': {
      api_type: 'rest_json',
      base_endpoint: 'https://recruit.zoho.com/recruit/v2',
      category: 'general',
    },
    breezyhr: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.breezy.hr/v3',
      category: 'general',
    },
    
    // Staffing
    bullhorn: {
      api_type: 'rest_json',
      base_endpoint: 'https://rest.bullhornstaffing.com/rest-services',
      category: 'staffing',
    },
    
    // Retail & High-Volume
    fountain: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.fountain.com/v2',
      category: 'retail',
    },
    paradox: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.paradox.ai/api/v1',
      category: 'retail',
    },
    
    // Hospitality
    harri: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.harri.com/v1',
      category: 'hospitality',
    },
    
    // Healthcare
    healthcaresource: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.healthcaresource.com/v1',
      category: 'healthcare',
    },
    
    // Enterprise HCM
    workday: {
      api_type: 'rest_json',
      base_endpoint: 'https://wd2-impl-services1.workday.com',
      category: 'enterprise',
    },
    successfactors: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.successfactors.com/odata/v2',
      category: 'enterprise',
    },
  };

  const systemConfig = systemConfigs[slug];
  if (!systemConfig) {
    throw new Error(`Unknown ATS slug: ${slug}`);
  }

  const system: ATSSystem = {
    id: '',
    name: slug,
    slug,
    api_type: systemConfig.api_type || 'rest_json',
    base_endpoint: systemConfig.base_endpoint,
    credential_schema: {},
    field_schema: {},
    supports_test_mode: true,
    category: 'general',
    is_active: true,
  };

  return createATSAdapter(system, connection, fieldMapping);
}
