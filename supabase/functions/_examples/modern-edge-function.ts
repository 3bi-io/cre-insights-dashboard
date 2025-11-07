/**
 * Modern Edge Function Template
 * 
 * This template demonstrates best practices for edge functions using
 * all the shared utilities for consistency, reliability, and maintainability.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Import shared utilities
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger, measureTime } from '../_shared/logger.ts';
import { createHttpClient } from '../_shared/http-client.ts';
import { validatePagination, isValidUuid } from '../_shared/validation-helpers.ts';

// Create logger for this function
const logger = createLogger('modern-edge-function');

// Define request schema with Zod
const requestSchema = z.object({
  action: z.enum(['fetch', 'create', 'update', 'delete']),
  resourceId: z.string().uuid().optional(),
  data: z.record(z.any()).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

/**
 * Main handler function
 */
async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, {}, origin);
  }

  // Enforce authentication (with role requirement)
  const authResult = await enforceAuth(req, 'user');
  if (authResult instanceof Response) return authResult;
  
  const { userId, userRole, organizationId } = authResult;
  
  // Add auth context to logger
  const contextLogger = logger.child({ userId, organizationId });
  contextLogger.info('Request received');

  // Parse and validate request body
  let body;
  try {
    body = await req.json();
  } catch {
    return validationErrorResponse('Invalid JSON body', origin);
  }

  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(
      validation.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })),
      origin
    );
  }

  const { action, resourceId, data, page, limit } = validation.data;
  contextLogger.info('Validated request', { action });

  // Get Supabase clients
  const supabase = getServiceClient();
  
  // Handle different actions
  switch (action) {
    case 'fetch':
      return await handleFetch(supabase, contextLogger, page, limit, organizationId, origin);
    
    case 'create':
      return await handleCreate(supabase, contextLogger, data, userId, organizationId, origin);
    
    case 'update':
      if (!resourceId) {
        throw new ValidationError('resourceId is required for update action');
      }
      return await handleUpdate(supabase, contextLogger, resourceId, data, userId, origin);
    
    case 'delete':
      if (!resourceId) {
        throw new ValidationError('resourceId is required for delete action');
      }
      return await handleDelete(supabase, contextLogger, resourceId, userId, origin);
    
    default:
      return errorResponse('Unknown action', 400, {}, origin);
  }
}

/**
 * Handle fetch action with pagination
 */
async function handleFetch(
  supabase: any,
  logger: any,
  page: number | undefined,
  limit: number | undefined,
  organizationId: string | null,
  origin: string | null
): Promise<Response> {
  // Validate pagination
  const pagination = validatePagination(page, limit);
  
  // Fetch data with performance tracking
  const result = await measureTime(logger, 'fetch-resources', async () => {
    logger.dbQuery('SELECT', 'resources');
    
    const { data, error, count } = await supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .range(pagination.offset, pagination.offset + pagination.limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, count };
  });

  return successResponse(
    result.data,
    'Resources fetched successfully',
    {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.count,
      },
    },
    origin
  );
}

/**
 * Handle create action
 */
async function handleCreate(
  supabase: any,
  logger: any,
  data: Record<string, any> | undefined,
  userId: string,
  organizationId: string | null,
  origin: string | null
): Promise<Response> {
  if (!data) {
    throw new ValidationError('Data is required for create action');
  }

  // Validate required fields
  if (!data.name || !data.type) {
    throw new ValidationError('Missing required fields', [
      { field: 'name', message: 'Name is required' },
      { field: 'type', message: 'Type is required' },
    ]);
  }

  const result = await measureTime(logger, 'create-resource', async () => {
    logger.dbQuery('INSERT', 'resources');
    
    const { data: created, error } = await supabase
      .from('resources')
      .insert({
        ...data,
        user_id: userId,
        organization_id: organizationId,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return created;
  });

  logger.info('Resource created', { resourceId: result.id });

  return successResponse(result, 'Resource created successfully', {}, origin);
}

/**
 * Handle update action
 */
async function handleUpdate(
  supabase: any,
  logger: any,
  resourceId: string,
  data: Record<string, any> | undefined,
  userId: string,
  origin: string | null
): Promise<Response> {
  if (!data) {
    throw new ValidationError('Data is required for update action');
  }

  const result = await measureTime(logger, 'update-resource', async () => {
    logger.dbQuery('UPDATE', 'resources');
    
    const { data: updated, error } = await supabase
      .from('resources')
      .update(data)
      .eq('id', resourceId)
      .eq('user_id', userId) // Ensure user owns the resource
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new ValidationError('Resource not found or access denied');
      }
      throw error;
    }
    
    return updated;
  });

  logger.info('Resource updated', { resourceId });

  return successResponse(result, 'Resource updated successfully', {}, origin);
}

/**
 * Handle delete action
 */
async function handleDelete(
  supabase: any,
  logger: any,
  resourceId: string,
  userId: string,
  origin: string | null
): Promise<Response> {
  await measureTime(logger, 'delete-resource', async () => {
    logger.dbQuery('DELETE', 'resources');
    
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId); // Ensure user owns the resource
    
    if (error) throw error;
  });

  logger.info('Resource deleted', { resourceId });

  return successResponse(
    { id: resourceId },
    'Resource deleted successfully',
    {},
    origin
  );
}

/**
 * Example: External API call with retry
 */
async function callExternalAPI(data: any): Promise<any> {
  const client = createHttpClient({
    timeout: 10000,
    retries: 3,
    headers: {
      'Authorization': `Bearer ${Deno.env.get('API_KEY')}`,
    },
  });

  logger.apiRequest('POST', 'https://api.example.com/endpoint');
  
  const startTime = Date.now();
  const response = await client.post('https://api.example.com/endpoint', data);
  const duration = Date.now() - startTime;
  
  logger.apiResponse('POST', 'https://api.example.com/endpoint', response.status, duration);

  return response.data;
}

// Serve the function with error handling wrapper
serve(
  wrapHandler(handler, {
    context: 'modern-edge-function',
    logRequests: true,
  })
);
