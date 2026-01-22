/**
 * Tenstreet Bulk Operations Handler
 * Handles bulk imports, exports, status updates, and sync operations
 */

import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('tenstreet-bulk-operations');

interface BulkOperationRequest {
  operationType: 'import' | 'export' | 'status_update' | 'sync' | 'export_organization_data';
  fileData?: string; // Base64 encoded CSV/Excel
  applicationIds?: string[];
  newStatus?: string;
  syncSource?: 'facebook' | 'hubspot' | 'indeed';
  fieldSelection?: string[];
  organizationId?: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    statuses?: string[];
    jobListingIds?: string[];
  };
  format?: 'csv' | 'xlsx';
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    // Authenticate user - require admin for bulk operations
    const authContext = await enforceAuth(req, 'admin');
    if (authContext instanceof Response) return authContext;

    const supabase = getServiceClient();
    const { 
      operationType, 
      fileData, 
      applicationIds, 
      newStatus, 
      syncSource,
      fieldSelection,
      organizationId: requestOrgId,
      filters,
      format
    } = await req.json() as BulkOperationRequest;

    if (!operationType) {
      return validationErrorResponse('operationType is required');
    }

    logger.info('Starting bulk operation', { operationType, organizationId: authContext.organizationId });

    let result;
    let operationDetails: Record<string, any> = {};

    switch (operationType) {
      case 'import':
        if (!fileData) {
          return validationErrorResponse('fileData is required for import operations');
        }
        result = await handleBulkImport(supabase, authContext.organizationId, fileData);
        operationDetails = { recordsProcessed: result.imported, errors: result.errors };
        break;

      case 'export':
        if (!applicationIds || applicationIds.length === 0) {
          return validationErrorResponse('applicationIds are required for export operations');
        }
        result = await handleBulkExport(supabase, authContext.organizationId, applicationIds, fieldSelection);
        operationDetails = { recordsExported: result.count };
        break;

      case 'status_update':
        if (!applicationIds || !newStatus) {
          return validationErrorResponse('applicationIds and newStatus are required for status updates');
        }
        result = await handleBulkStatusUpdate(supabase, authContext.organizationId, applicationIds, newStatus);
        operationDetails = { recordsUpdated: result.updated };
        break;

      case 'sync':
        if (!syncSource) {
          return validationErrorResponse('syncSource is required for sync operations');
        }
        result = await handleBulkSync(supabase, authContext.organizationId, syncSource);
        operationDetails = { recordsSynced: result.synced };
        break;

      case 'export_organization_data':
        result = await handleOrganizationExport(
          supabase, 
          requestOrgId || authContext.organizationId, 
          filters || {},
          fieldSelection,
          format || 'csv'
        );
        operationDetails = { recordsExported: result.count };
        // Return early with export data
        if (result.success && result.exportData) {
          // Log the operation
          await supabase
            .from('tenstreet_bulk_operations')
            .insert({
              organization_id: requestOrgId || authContext.organizationId,
              operation_type: 'export_organization_data',
              status: 'completed',
              records_processed: result.count,
              errors: [],
              initiated_by: authContext.userId,
              completed_at: new Date().toISOString()
            });
          
          return successResponse({
            exportData: result.exportData,
            count: result.count,
            format: result.format,
          }, 'Export completed successfully');
        }
        break;

      default:
        return validationErrorResponse(`Invalid operation type: ${operationType}`);
    }

    // Log the bulk operation
    const { data: operation, error: logError } = await supabase
      .from('tenstreet_bulk_operations')
      .insert({
        organization_id: authContext.organizationId,
        operation_type: operationType,
        status: result.success ? 'completed' : 'failed',
        records_processed: operationDetails.recordsProcessed || operationDetails.recordsUpdated || operationDetails.recordsSynced || operationDetails.recordsExported || 0,
        errors: result.errors || [],
        initiated_by: authContext.userId,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      logger.error('Failed to log bulk operation', logError);
    }

    return successResponse({
      operationId: operation?.id,
      ...result,
      ...operationDetails
    }, `Bulk ${operationType} completed successfully`);

  } catch (error) {
    logger.error('Error in bulk operations', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
  }
});

async function handleBulkImport(supabase: any, organizationId: string, fileData: string) {
  try {
    // Decode base64 CSV data
    const csvData = atob(fileData);
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      try {
        const values = lines[i].split(',').map(v => v.trim());
        const record: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || null;
        });

        // Map to application structure (basic mapping)
        const applicationData = {
          first_name: record.first_name || record.FirstName,
          last_name: record.last_name || record.LastName,
          applicant_email: record.email || record.applicant_email,
          phone: record.phone || record.Phone,
          status: record.status || 'new',
          source: 'bulk_import',
          job_listing_id: record.job_listing_id // Must be provided
        };

        if (!applicationData.job_listing_id) {
          errors.push({ line: i + 1, error: 'Missing job_listing_id' });
          continue;
        }

        const { error: insertError } = await supabase
          .from('applications')
          .insert(applicationData);

        if (insertError) {
          errors.push({ line: i + 1, error: insertError.message });
        } else {
          imported.push(i + 1);
        }
      } catch (error) {
        errors.push({ line: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: true,
      imported: imported.length,
      errors
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [{ error: error instanceof Error ? error.message : 'Failed to parse import file' }]
    };
  }
}

async function handleBulkExport(supabase: any, organizationId: string, applicationIds: string[], fieldSelection?: string[]) {
  const fields = fieldSelection?.join(',') || '*';
  
  const { data, error } = await supabase
    .from('applications')
    .select(`${fields}, job_listings!inner(organization_id)`)
    .eq('job_listings.organization_id', organizationId)
    .in('id', applicationIds);

  if (error) throw error;

  // Convert to CSV
  const headers = fieldSelection || Object.keys(data[0] || {});
  const csvLines = [headers.join(',')];
  
  data.forEach((record: any) => {
    const values = headers.map(h => {
      const value = record[h];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    csvLines.push(values.join(','));
  });

  const csvData = csvLines.join('\n');
  const base64Data = btoa(csvData);

  return {
    success: true,
    count: data.length,
    exportData: base64Data,
    format: 'csv'
  };
}

async function handleBulkStatusUpdate(supabase: any, organizationId: string, applicationIds: string[], newStatus: string) {
  // Verify applications belong to organization
  const { data: applications, error: fetchError } = await supabase
    .from('applications')
    .select('id, job_listings!inner(organization_id)')
    .eq('job_listings.organization_id', organizationId)
    .in('id', applicationIds);

  if (fetchError) throw fetchError;

  const validIds = applications.map((app: any) => app.id);

  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', validIds);

  if (updateError) throw updateError;

  return {
    success: true,
    updated: validIds.length
  };
}

async function handleBulkSync(supabase: any, organizationId: string, syncSource: string) {
  logger.info('Syncing applications', { syncSource, organizationId });
  
  // This would integrate with external APIs (Facebook, HubSpot, Indeed)
  // For now, return a placeholder implementation
  
  return {
    success: true,
    synced: 0,
    message: `Sync from ${syncSource} is not yet implemented`
  };
}

async function handleOrganizationExport(
  supabase: any, 
  organizationId: string, 
  filters: {
    dateFrom?: string;
    dateTo?: string;
    statuses?: string[];
    jobListingIds?: string[];
  },
  fieldSelection?: string[],
  format: 'csv' | 'xlsx' = 'csv'
) {
  logger.info('Exporting organization data', { organizationId, filters, format });

  try {
    // Build query for applications with organization filter via job_listings
    let query = supabase
      .from('applications')
      .select(`
        id,
        first_name,
        last_name,
        applicant_email,
        phone,
        address_1,
        address_2,
        city,
        state,
        zip,
        status,
        applied_at,
        source,
        cdl_class,
        cdl_endorsements,
        driving_experience_years,
        exp,
        notes,
        created_at,
        job_listings!inner(id, title, organization_id)
      `)
      .eq('job_listings.organization_id', organizationId);

    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('applied_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('applied_at', filters.dateTo);
    }
    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }
    if (filters.jobListingIds && filters.jobListingIds.length > 0) {
      query = query.in('job_listing_id', filters.jobListingIds);
    }

    query = query.order('applied_at', { ascending: false });

    const { data: applications, error } = await query;

    if (error) {
      logger.error('Error fetching applications for export', error);
      throw error;
    }

    if (!applications || applications.length === 0) {
      return {
        success: true,
        count: 0,
        exportData: '',
        format
      };
    }

    // Default fields if none specified
    const fields = fieldSelection && fieldSelection.length > 0 
      ? fieldSelection 
      : ['first_name', 'last_name', 'applicant_email', 'phone', 'status', 'applied_at'];

    // Build CSV
    const headers = fields.map(f => {
      // Convert snake_case to Title Case for headers
      return f.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });

    const csvLines = [headers.join(',')];

    applications.forEach((app: any) => {
      const values = fields.map(field => {
        let value = app[field];
        
        // Handle arrays (like cdl_endorsements)
        if (Array.isArray(value)) {
          value = value.join('; ');
        }
        
        // Handle dates
        if (field === 'applied_at' || field === 'created_at') {
          value = value ? new Date(value).toLocaleDateString() : '';
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Escape CSV values
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvLines.push(values.join(','));
    });

    const csvData = csvLines.join('\n');
    
    // For XLSX format, we still return CSV but the frontend can handle conversion
    // In production, you might use a library like xlsx on the backend
    const base64Data = btoa(unescape(encodeURIComponent(csvData)));

    return {
      success: true,
      count: applications.length,
      exportData: base64Data,
      format: 'csv' // Always CSV for now, frontend handles the naming
    };

  } catch (error) {
    logger.error('Organization export error', error);
    return {
      success: false,
      count: 0,
      errors: [{ error: error instanceof Error ? error.message : 'Export failed' }]
    };
  }
}
