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

// Re-export auto-post engine
export { autoPostToATS, hasAutoPostEnabled, getAutoPostTargets } from './auto-post-engine.ts';

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
      return new RESTJSONAdapter(config);
    
    default:
      return new RESTJSONAdapter(config);
  }
}

/**
 * Get adapter for a specific ATS by slug with predefined configuration
 */
export function getAdapterBySlug(
  slug: string,
  connection: ATSConnection,
  fieldMapping?: FieldMapping
): BaseATSAdapter {
  const system = getSystemBySlug(slug);
  if (!system) {
    throw new Error(`Unknown ATS slug: ${slug}`);
  }
  return createATSAdapter(system, connection, fieldMapping);
}

/**
 * Get predefined system configuration by slug
 */
export function getSystemBySlug(slug: string): ATSSystem | null {
  const systemConfigs: Record<string, Partial<ATSSystem>> = {
    // Trucking
    tenstreet: {
      name: 'Tenstreet',
      api_type: 'xml_post',
      base_endpoint: 'https://dashboard.tenstreet.com/post/',
      category: 'trucking',
      supports_test_mode: true,
    },
    driverreach: {
      name: 'DriverReach',
      api_type: 'rest_json',
      base_endpoint: 'https://api.driverreach.com/v1',
      category: 'trucking',
      supports_test_mode: true,
    },
    workn: {
      name: 'Workn',
      api_type: 'rest_json',
      base_endpoint: 'https://api.workn.com/v1',
      category: 'trucking',
    },
    
    // General/Tech
    greenhouse: {
      name: 'Greenhouse',
      api_type: 'rest_json',
      base_endpoint: 'https://harvest.greenhouse.io/v1',
      category: 'tech',
      documentation_url: 'https://developers.greenhouse.io/harvest.html',
    },
    lever: {
      name: 'Lever',
      api_type: 'rest_json',
      base_endpoint: 'https://api.lever.co/v1',
      category: 'tech',
      supports_test_mode: true,
      documentation_url: 'https://hire.lever.co/developer/documentation',
    },
    workable: {
      name: 'Workable',
      api_type: 'rest_json',
      base_endpoint: 'https://www.workable.com/spi/v3',
      category: 'general',
    },
    jazzhr: {
      name: 'JazzHR',
      api_type: 'rest_json',
      base_endpoint: 'https://api.resumatorapi.com/v1',
      category: 'general',
    },
    bamboohr: {
      name: 'BambooHR',
      api_type: 'rest_json',
      base_endpoint: 'https://api.bamboohr.com/api/gateway.php',
      category: 'general',
    },
    icims: {
      name: 'iCIMS',
      api_type: 'rest_json',
      base_endpoint: 'https://api.icims.com/customers',
      category: 'enterprise',
    },
    smartrecruiters: {
      name: 'SmartRecruiters',
      api_type: 'rest_json',
      base_endpoint: 'https://api.smartrecruiters.com',
      category: 'enterprise',
    },
    ashby: {
      name: 'Ashby',
      api_type: 'rest_json',
      base_endpoint: 'https://api.ashbyhq.com',
      category: 'tech',
    },
    jobvite: {
      name: 'Jobvite',
      api_type: 'rest_json',
      base_endpoint: 'https://api.jobvite.com/v2',
      category: 'general',
      supports_test_mode: true,
    },
    
    // Staffing
    bullhorn: {
      name: 'Bullhorn',
      api_type: 'rest_json',
      base_endpoint: 'https://rest.bullhornstaffing.com/rest-services',
      category: 'staffing',
    },
    
    // Retail & High-Volume
    fountain: {
      name: 'Fountain',
      api_type: 'rest_json',
      base_endpoint: 'https://api.fountain.com/v2',
      category: 'retail',
    },
    
    // Hospitality
    harri: {
      name: 'Harri',
      api_type: 'rest_json',
      base_endpoint: 'https://api.harri.com/v1',
      category: 'hospitality',
    },
    
    // Healthcare
    healthcaresource: {
      name: 'HealthcareSource',
      api_type: 'rest_json',
      base_endpoint: 'https://api.healthcaresource.com/v1',
      category: 'healthcare',
    },
    hireology: {
      name: 'Hireology',
      api_type: 'rest_json',
      base_endpoint: 'https://api.hireology.com/v1',
      category: 'healthcare',
    },
    
    // Double Nickel (trucking, Auth0 OAuth)
    doublenickel: {
      name: 'Double Nickel',
      api_type: 'rest_json',
      base_endpoint: 'https://dashboard.getdoublenickel.com/api/applicants',
      category: 'trucking',
      supports_test_mode: true,
    },
  };

  const systemConfig = systemConfigs[slug];
  if (!systemConfig) {
    return null;
  }

  return {
    id: slug,
    name: systemConfig.name || slug,
    slug,
    api_type: systemConfig.api_type || 'rest_json',
    base_endpoint: systemConfig.base_endpoint,
    credential_schema: {},
    field_schema: {},
    supports_test_mode: systemConfig.supports_test_mode || false,
    documentation_url: systemConfig.documentation_url,
    category: systemConfig.category || 'general',
    is_active: true,
  };
}

/**
 * Get list of all supported ATS systems
 */
export function getSupportedSystems(): Array<{ slug: string; name: string; category: string }> {
  const slugs = [
    'tenstreet', 'driverreach', 'workn', 'doublenickel',
    'greenhouse', 'lever', 'workable', 'jazzhr', 'bamboohr',
    'icims', 'smartrecruiters', 'ashby', 'jobvite',
    'bullhorn', 'fountain', 'harri',
    'healthcaresource', 'hireology'
  ];

  return slugs.map(slug => {
    const system = getSystemBySlug(slug);
    return {
      slug,
      name: system?.name || slug,
      category: system?.category || 'general'
    };
  });
}
