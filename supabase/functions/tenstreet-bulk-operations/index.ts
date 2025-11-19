/**
 * Tenstreet Bulk Operations Handler
 * Handles bulk imports, exports, status updates, and sync operations
 */

import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';

interface BulkOperationRequest {
  operationType: 'import' | 'export' | 'status_update' | 'sync';
  fileData?: string; // Base64 encoded CSV/Excel
  applicationIds?: string[];
  newStatus?: string;
  syncSource?: 'facebook' | 'hubspot' | 'indeed';
  fieldSelection?: string[];
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
      fieldSelection 
    } = await req.json() as BulkOperationRequest;

    if (!operationType) {
      return validationErrorResponse('operationType is required');
    }

    console.log(`Starting bulk operation: ${operationType} for org ${authContext.organizationId}`);

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
      console.error('Failed to log bulk operation:', logError);
    }

    return successResponse({
      operationId: operation?.id,
      ...result,
      ...operationDetails
    }, `Bulk ${operationType} completed successfully`);

  } catch (error) {
    console.error('Error in tenstreet-bulk-operations function:', error);
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
  console.log(`Syncing applications from ${syncSource} for organization ${organizationId}`);
  
  // This would integrate with external APIs (Facebook, HubSpot, Indeed)
  // For now, return a placeholder implementation
  
  return {
    success: true,
    synced: 0,
    message: `Sync from ${syncSource} is not yet implemented`
  };
}
