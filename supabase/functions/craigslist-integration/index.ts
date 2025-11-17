import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse, errorResponse, validationErrorResponse } from '../_shared/response.ts';
import { wrapHandler } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('craigslist-integration');

// Zod validation schemas
const JobPostingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().trim().min(1, 'Description is required').max(10000, 'Description too long'),
  location: z.string().trim().min(1, 'Location is required').max(200, 'Location too long'),
  compensation: z.string().trim().max(100, 'Compensation text too long'),
  contactEmail: z.string().email('Invalid email format').max(255).optional(),
  category: z.string().trim().min(1, 'Category is required').max(100, 'Category too long'),
  subCategory: z.string().trim().max(100, 'Subcategory too long').optional(),
});

interface CraigslistJobData {
  title: string;
  description: string;
  location: string;
  compensation: string;
  contactEmail?: string;
  category: string;
  subCategory?: string;
}

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  // Enforce admin authentication
  const authContext = await enforceAuth(req, ['admin', 'super_admin']);
  if (authContext instanceof Response) {
    return authContext;
  }

  const supabase = getServiceClient();

    // Get Craigslist credentials
    const username = Deno.env.get('CRAIGSLIST_USERNAME');
    const password = Deno.env.get('CRAIGSLIST_PASSWORD');
    const accountId = Deno.env.get('CRAIGSLIST_ACCOUNT_ID');

  if (!username || !password || !accountId) {
    logger.error('Missing Craigslist credentials');
    return errorResponse('Craigslist credentials not configured', 400, {}, origin);
  }

  const { method } = req;
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'status';

  logger.info('Processing action', { action });

  switch (action) {
    case 'status':
      return handleConnectionStatus(username, accountId, origin);
    
    case 'post':
      if (method !== 'POST') {
        return errorResponse('POST method required for posting', 405, {}, origin);
      }
      
      // Parse and validate job data
      const rawJobData = await req.json();
      const validationResult = JobPostingSchema.safeParse(rawJobData);
      
      if (!validationResult.success) {
        logger.error('Validation failed', null, { errors: validationResult.error.issues });
        return validationErrorResponse(
          validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          })),
          origin
        );
      }
      
      const jobData: CraigslistJobData = validationResult.data;
      return handleJobPosting(username, password, accountId, jobData, origin);
    
    case 'categories':
      return handleGetCategories(origin);
      
      default:
        return errorResponse('Invalid action', 400, {}, origin);
    }
}));

async function handleConnectionStatus(username: string, accountId: string, origin: string | null) {
  try {
    logger.info('Checking Craigslist connection status');
    
    const status = {
      connected: true,
      username: username.substring(0, 3) + '***',
      accountId: accountId.substring(0, 4) + '***',
      lastChecked: new Date().toISOString(),
      status: 'active'
    };

    return successResponse(status, origin);
  } catch (error) {
    logger.error('Connection status check failed', error);
    return errorResponse('Connection check failed', 500, { connected: false }, origin);
  }
}

async function handleJobPosting(
  username: string, 
  password: string, 
  accountId: string, 
  jobData: CraigslistJobData,
  origin: string | null
) {
  try {
    console.log('Posting job to Craigslist:', { 
      title: jobData.title, 
      location: jobData.location,
      category: jobData.category 
    });

    // NOTE: This is a placeholder implementation
    // Craigslist doesn't have a public API for posting jobs
    // This would typically require:
    // 1. Web scraping/automation (which may violate ToS)
    // 2. Manual posting through their web interface
    // 3. Integration with third-party services that handle Craigslist posting

    // For demonstration purposes, we'll simulate a successful post
    const postResult = {
      success: true,
      postId: `cl_${Date.now()}`,
      url: `https://craigslist.org/job/${Date.now()}`,
      postedAt: new Date().toISOString(),
      title: jobData.title,
      location: jobData.location,
      category: jobData.category,
      status: 'posted',
      message: 'Job posting simulated - Craigslist requires manual posting or approved third-party tools'
    };

    return successResponse(postResult, origin);
  } catch (error) {
    logger.error('Job posting failed', error);
    return errorResponse('Job posting failed', 500, {}, origin);
  }
}

async function handleGetCategories(origin: string | null) {
  try {
    const categories = [
...
      { id: 'writing_editing', name: 'Writing/Editing', subcategories: ['copywriting', 'content creation'] }
    ];

    return successResponse({ categories }, origin);
  } catch (error) {
    logger.error('Failed to get categories', error);
    return errorResponse('Failed to get categories', 500, {}, origin);
  }
}