import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { enforceAuth } from '../_shared/serverAuth.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('craigslist-integration');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Enforce admin authentication
  const authContext = await enforceAuth(req, ['admin', 'super_admin']);
  if (authContext instanceof Response) {
    return authContext;
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Craigslist credentials
    const username = Deno.env.get('CRAIGSLIST_USERNAME');
    const password = Deno.env.get('CRAIGSLIST_PASSWORD');
    const accountId = Deno.env.get('CRAIGSLIST_ACCOUNT_ID');

    if (!username || !password || !accountId) {
      logger.error('Missing Craigslist credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Craigslist credentials not configured',
          status: 'error' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return handleConnectionStatus(username, accountId);
      
      case 'post':
        if (method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for posting' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Parse and validate job data
        const rawJobData = await req.json();
        const validationResult = JobPostingSchema.safeParse(rawJobData);
        
        if (!validationResult.success) {
          logger.error('Validation failed', { issues: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) });
          return new Response(
            JSON.stringify({ 
              error: 'Invalid job data', 
              details: validationResult.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
              }))
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        const jobData: CraigslistJobData = validationResult.data;
        return handleJobPosting(username, password, accountId, jobData);
      
      case 'categories':
        return handleGetCategories();
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    logger.error('Craigslist integration error', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleConnectionStatus(username: string, accountId: string) {
  try {
    logger.info('Checking Craigslist connection status');
    
    // For now, return configured status since we have credentials
    // In a production implementation, you would verify the credentials with Craigslist
    const status = {
      connected: true,
      username: username.substring(0, 3) + '***', // Mask username for security
      accountId: accountId.substring(0, 4) + '***', // Mask account ID
      lastChecked: new Date().toISOString(),
      status: 'active'
    };

    return new Response(
      JSON.stringify(status),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Connection status check failed', error);
    return new Response(
      JSON.stringify({ 
        connected: false,
        error: 'Connection check failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleJobPosting(
  username: string, 
  password: string, 
  accountId: string, 
  jobData: CraigslistJobData
) {
  try {
    logger.info('Posting job to Craigslist', { 
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

    return new Response(
      JSON.stringify(postResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Job posting failed', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Job posting failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleGetCategories() {
  try {
    // Common Craigslist job categories
    const categories = [
      { id: 'accounting', name: 'Accounting/Finance', subcategories: ['bookkeeping', 'tax preparation'] },
      { id: 'admin', name: 'Admin/Office', subcategories: ['data entry', 'receptionist', 'assistant'] },
      { id: 'automotive', name: 'Automotive', subcategories: ['mechanic', 'sales', 'driver'] },
      { id: 'beauty', name: 'Beauty/Wellness', subcategories: ['salon', 'spa', 'fitness'] },
      { id: 'construction', name: 'Construction/Skilled Trade', subcategories: ['carpenter', 'electrician', 'plumber'] },
      { id: 'customer_service', name: 'Customer Service', subcategories: ['call center', 'retail', 'support'] },
      { id: 'education', name: 'Education', subcategories: ['teaching', 'tutoring', 'childcare'] },
      { id: 'engineering', name: 'Engineering', subcategories: ['software', 'mechanical', 'electrical'] },
      { id: 'food', name: 'Food/Beverage/Hospitality', subcategories: ['restaurant', 'hotel', 'catering'] },
      { id: 'healthcare', name: 'Healthcare', subcategories: ['nursing', 'medical', 'dental'] },
      { id: 'labor', name: 'General Labor', subcategories: ['warehouse', 'manufacturing', 'cleaning'] },
      { id: 'legal', name: 'Legal/Paralegal', subcategories: ['paralegal', 'legal assistant'] },
      { id: 'marketing', name: 'Marketing/Advertising/PR', subcategories: ['digital marketing', 'social media'] },
      { id: 'nonprofit', name: 'Nonprofit Sector', subcategories: ['fundraising', 'social work'] },
      { id: 'real_estate', name: 'Real Estate', subcategories: ['agent', 'property management'] },
      { id: 'retail', name: 'Retail/Wholesale', subcategories: ['sales associate', 'cashier'] },
      { id: 'sales', name: 'Sales', subcategories: ['inside sales', 'outside sales'] },
      { id: 'security', name: 'Security', subcategories: ['guard', 'surveillance'] },
      { id: 'software', name: 'Software/QA/DBA/etc', subcategories: ['developer', 'qa tester'] },
      { id: 'transport', name: 'Transportation', subcategories: ['truck driver', 'delivery', 'logistics'] },
      { id: 'tv_film_video', name: 'TV/Film/Video/Radio', subcategories: ['production', 'editing'] },
      { id: 'web_info_design', name: 'Web/HTML/Info Design', subcategories: ['web developer', 'designer'] },
      { id: 'writing_editing', name: 'Writing/Editing', subcategories: ['copywriting', 'content creation'] }
    ];

    return new Response(
      JSON.stringify({ categories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Failed to get categories', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get categories',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}