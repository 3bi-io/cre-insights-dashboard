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
    tenstreet: {
      api_type: 'xml_post',
      base_endpoint: 'https://xchange.tenstreet.com/post/',
    },
    driverreach: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.driverreach.com/v1',
    },
    greenhouse: {
      api_type: 'rest_json',
      base_endpoint: 'https://harvest.greenhouse.io/v1',
    },
    lever: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.lever.co/v1',
    },
    workable: {
      api_type: 'rest_json',
    },
    jazzhr: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.resumatorapi.com/v1',
    },
    bamboohr: {
      api_type: 'rest_json',
    },
    icims: {
      api_type: 'rest_json',
      base_endpoint: 'https://api.icims.com',
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
