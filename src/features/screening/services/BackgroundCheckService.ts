import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BGCProvider {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  supported_checks: string[];
  pricing: Record<string, number>;
  is_active: boolean;
}

export interface BGCConnection {
  id: string;
  organization_id: string;
  provider_id: string;
  provider?: BGCProvider;
  is_enabled: boolean;
  is_default: boolean;
  package_mappings: Record<string, string>;
  created_at: string;
}

export interface BGCRequest {
  id: string;
  organization_id: string;
  application_id: string | null;
  provider_id: string;
  connection_id: string | null;
  check_type: string;
  package_name: string | null;
  status: string;
  external_id: string | null;
  candidate_id: string | null;
  candidate_portal_url: string | null;
  result: string | null;
  result_data: Record<string, unknown>;
  report_url: string | null;
  cost_cents: number | null;
  initiated_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface InitiateCheckParams {
  applicationId: string;
  checkType: string;
  connectionId?: string;
  providerId?: string;
  packageName?: string;
}

export interface InitiateCheckResult {
  requestId: string;
  externalId: string;
  candidatePortalUrl?: string;
  status: string;
}

/**
 * Service for managing background check operations
 */
export class BackgroundCheckService {
  /**
   * Get all available BGC providers
   */
  static async getProviders(): Promise<BGCProvider[]> {
    logger.debug('BackgroundCheckService: Fetching providers');
    
    const { data, error } = await supabase
      .from('background_check_providers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('BackgroundCheckService: Error fetching providers', error);
      throw error;
    }

    return (data || []).map(p => ({
      ...p,
      supported_checks: Array.isArray(p.supported_checks) ? (p.supported_checks as unknown as string[]) : [],
      pricing: typeof p.pricing === 'object' && p.pricing !== null ? p.pricing as Record<string, number> : {}
    })) as BGCProvider[];
  }

  /**
   * Get organization's BGC connections
   */
  static async getConnections(organizationId: string): Promise<BGCConnection[]> {
    logger.debug('BackgroundCheckService: Fetching connections', { organizationId });
    
    const { data, error } = await supabase
      .from('organization_bgc_connections')
      .select(`
        *,
        provider:background_check_providers(*)
      `)
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false });

    if (error) {
      logger.error('BackgroundCheckService: Error fetching connections', error, { organizationId });
      throw error;
    }

    return (data || []).map(c => ({
      ...c,
      package_mappings: typeof c.package_mappings === 'object' && c.package_mappings !== null 
        ? c.package_mappings as Record<string, string> 
        : {},
      provider: c.provider ? {
        ...c.provider,
        supported_checks: Array.isArray(c.provider.supported_checks) 
          ? (c.provider.supported_checks as unknown as string[]) 
          : [],
        pricing: typeof c.provider.pricing === 'object' && c.provider.pricing !== null 
          ? c.provider.pricing as Record<string, number> 
          : {}
      } : undefined
    })) as BGCConnection[];
  }

  /**
   * Create a new BGC connection for an organization
   */
  static async createConnection(
    organizationId: string,
    providerId: string,
    credentials: Record<string, string>,
    options?: {
      isDefault?: boolean;
      packageMappings?: Record<string, string>;
      webhookSecret?: string;
    }
  ): Promise<BGCConnection> {
    logger.debug('BackgroundCheckService: Creating connection', { organizationId, providerId });

    // If this is set as default, unset other defaults first
    if (options?.isDefault) {
      await supabase
        .from('organization_bgc_connections')
        .update({ is_default: false })
        .eq('organization_id', organizationId);
    }

    const { data, error } = await supabase
      .from('organization_bgc_connections')
      .insert({
        organization_id: organizationId,
        provider_id: providerId,
        credentials,
        is_default: options?.isDefault ?? false,
        package_mappings: options?.packageMappings ?? {},
        webhook_secret: options?.webhookSecret
      })
      .select()
      .single();

    if (error) {
      logger.error('BackgroundCheckService: Error creating connection', error, { organizationId, providerId });
      throw error;
    }

    return {
      ...data,
      package_mappings: typeof data.package_mappings === 'object' && data.package_mappings !== null 
        ? data.package_mappings as Record<string, string> 
        : {}
    };
  }

  /**
   * Update a BGC connection
   */
  static async updateConnection(
    connectionId: string,
    updates: {
      credentials?: Record<string, string>;
      isEnabled?: boolean;
      isDefault?: boolean;
      packageMappings?: Record<string, string>;
      webhookSecret?: string;
    }
  ): Promise<BGCConnection> {
    logger.debug('BackgroundCheckService: Updating connection', { connectionId });

    const updatePayload: Record<string, unknown> = {};
    if (updates.credentials) updatePayload.credentials = updates.credentials;
    if (updates.isEnabled !== undefined) updatePayload.is_enabled = updates.isEnabled;
    if (updates.isDefault !== undefined) updatePayload.is_default = updates.isDefault;
    if (updates.packageMappings) updatePayload.package_mappings = updates.packageMappings;
    if (updates.webhookSecret) updatePayload.webhook_secret = updates.webhookSecret;

    const { data, error } = await supabase
      .from('organization_bgc_connections')
      .update(updatePayload)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      logger.error('BackgroundCheckService: Error updating connection', error, { connectionId });
      throw error;
    }

    return {
      ...data,
      package_mappings: typeof data.package_mappings === 'object' && data.package_mappings !== null 
        ? data.package_mappings as Record<string, string> 
        : {}
    };
  }

  /**
   * Delete a BGC connection
   */
  static async deleteConnection(connectionId: string): Promise<void> {
    logger.debug('BackgroundCheckService: Deleting connection', { connectionId });

    const { error } = await supabase
      .from('organization_bgc_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      logger.error('BackgroundCheckService: Error deleting connection', error, { connectionId });
      throw error;
    }
  }

  /**
   * Initiate a background check via edge function
   */
  static async initiateCheck(params: InitiateCheckParams): Promise<InitiateCheckResult> {
    logger.debug('BackgroundCheckService: Initiating check', { applicationId: params.applicationId, checkType: params.checkType });

    const { data, error } = await supabase.functions.invoke('background-check', {
      body: {
        action: 'initiate',
        applicationId: params.applicationId,
        checkType: params.checkType,
        connectionId: params.connectionId,
        providerId: params.providerId,
        packageName: params.packageName
      }
    });

    if (error) {
      logger.error('BackgroundCheckService: Error initiating check', error, { applicationId: params.applicationId });
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to initiate background check');
    }

    return {
      requestId: data.requestId,
      externalId: data.externalId,
      candidatePortalUrl: data.candidatePortalUrl,
      status: data.status
    };
  }

  /**
   * Get status of a background check
   */
  static async getCheckStatus(requestId: string): Promise<BGCRequest> {
    logger.debug('BackgroundCheckService: Getting check status', { requestId });

    const { data, error } = await supabase
      .from('background_check_requests')
      .select(`
        *,
        provider:background_check_providers(name, slug, logo_url)
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      logger.error('BackgroundCheckService: Error getting check status', error, { requestId });
      throw error;
    }

    return {
      ...data,
      result_data: typeof data.result_data === 'object' && data.result_data !== null 
        ? data.result_data as Record<string, unknown> 
        : {}
    };
  }

  /**
   * Get all background check requests for an application
   */
  static async getRequestsByApplication(applicationId: string): Promise<BGCRequest[]> {
    logger.debug('BackgroundCheckService: Getting requests for application', { applicationId });

    const { data, error } = await supabase
      .from('background_check_requests')
      .select(`
        *,
        provider:background_check_providers(name, slug, logo_url)
      `)
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('BackgroundCheckService: Error getting requests', error, { applicationId });
      throw error;
    }

    return (data || []).map(r => ({
      ...r,
      result_data: typeof r.result_data === 'object' && r.result_data !== null 
        ? r.result_data as Record<string, unknown> 
        : {}
    }));
  }

  /**
   * Get all background check requests for an organization
   */
  static async getRequestsByOrganization(
    organizationId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<BGCRequest[]> {
    logger.debug('BackgroundCheckService: Getting requests for org', { organizationId });

    let query = supabase
      .from('background_check_requests')
      .select(`
        *,
        provider:background_check_providers(name, slug, logo_url)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('BackgroundCheckService: Error getting org requests', error, { organizationId });
      throw error;
    }

    return (data || []).map(r => ({
      ...r,
      result_data: typeof r.result_data === 'object' && r.result_data !== null 
        ? r.result_data as Record<string, unknown> 
        : {}
    }));
  }

  /**
   * Test a BGC connection
   */
  static async testConnection(connectionId: string): Promise<{ success: boolean; message: string }> {
    logger.debug('BackgroundCheckService: Testing connection', { connectionId });

    const { data, error } = await supabase.functions.invoke('background-check', {
      body: {
        action: 'test',
        connectionId
      }
    });

    if (error) {
      logger.error('BackgroundCheckService: Error testing connection', error, { connectionId });
      throw error;
    }

    return {
      success: data.success,
      message: data.message || (data.success ? 'Connection successful' : 'Connection failed')
    };
  }

  /**
   * Get available check types for a provider
   */
  static async getAvailableCheckTypes(providerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('background_check_providers')
      .select('supported_checks')
      .eq('id', providerId)
      .single();

    if (error) {
      logger.error('BackgroundCheckService: Error getting check types', error, { providerId });
      throw error;
    }

    return Array.isArray(data.supported_checks) ? (data.supported_checks as unknown as string[]) : [];
  }
}

export default BackgroundCheckService;
