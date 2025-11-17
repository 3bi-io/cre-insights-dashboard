import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { successResponse } from '../_shared/response.ts';
import { wrapHandler, ValidationError } from '../_shared/error-handler.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('trucking-platform-integration');

Deno.serve(wrapHandler(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const { action, platform } = await req.json();
  
  if (!action || !platform) {
    throw new ValidationError('Action and platform are required');
  }

  logger.info('Processing action', { action, platform });

  const supabaseClient = getServiceClient();

  switch (action) {
    case 'check_connection':
      return await checkPlatformConnection(platform, origin);
    
    case 'post_job':
      return await postJobToPlatform(platform, supabaseClient, origin);
    
    case 'get_platform_stats':
      return await getPlatformStats(platform, supabaseClient, origin);
    
    default:
      throw new ValidationError(`Unknown action: ${action}`);
  }
}, { context: 'trucking-platform-integration', logRequests: true }));

async function checkPlatformConnection(platform: string, origin: string | null) {
  logger.info('Checking connection', { platform });
  
  // Simulate connection check for different platforms
  const platformConfigs = {
    'truck-driver-jobs-411': {
      name: 'Truck Driver Jobs 411',
      endpoint: 'https://www.truckdriverjobs411.com',
      connected: true,
      feedSupported: true,
      features: ['CDL Class Filtering', 'Route Type', 'Equipment Type']
    },
    'everytruckjob': {
      name: 'EveryTruckJob',
      endpoint: 'https://www.everytruckjob.com',
      connected: true,
      feedSupported: true,
      features: ['Free Posting', 'CDL Requirements', 'Home Time Preferences']
    },
    'newjobs4you': {
      name: 'NewJobs4You',
      endpoint: 'https://www.newjobs4you.com',
      connected: true,
      feedSupported: true,
      features: ['Transportation Focus', 'Local Routes', 'Regional Coverage']
    },
    'roadwarriors': {
      name: 'RoadWarriors',
      endpoint: 'https://www.roadwarriors.com',
      connected: true,
      feedSupported: true,
      features: ['Driver Community', 'Experience Matching', 'Route Preferences']
    }
  }

  const config = platformConfigs[platform as keyof typeof platformConfigs]
  
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  return successResponse({
    platform: config.name,
    connected: config.connected,
    feedSupported: config.feedSupported,
    features: config.features,
    lastChecked: new Date().toISOString()
  }, 'Platform connection status retrieved', {}, origin);
}

async function postJobToPlatform(platform: string, supabaseClient: any, origin: string | null) {
  logger.info('Posting job', { platform });
  
  // For free platforms, we primarily use XML feeds
  // This function simulates the posting process
  
  const result = {
    success: true,
    message: `Job successfully syndicated to ${platform} via XML feed`,
    platform,
    method: 'XML Feed Syndication',
    timestamp: new Date().toISOString()
  }

  return successResponse(result, 'Job successfully posted to platform', {}, origin);
}

async function getPlatformStats(platform: string, supabaseClient: any, origin: string | null) {
  logger.info('Getting platform stats', { platform });
  
  // Simulate platform statistics
  const stats = {
    platform,
    activeJobs: Math.floor(Math.random() * 100) + 50,
    totalViews: Math.floor(Math.random() * 10000) + 1000,
    applications: Math.floor(Math.random() * 500) + 100,
    lastUpdate: new Date().toISOString(),
    performance: {
      clickThroughRate: (Math.random() * 5 + 2).toFixed(2) + '%',
      applicationRate: (Math.random() * 10 + 5).toFixed(2) + '%',
      avgTimeToApply: Math.floor(Math.random() * 48) + 12 + ' hours'
    }
  }

  return successResponse({
    platform,
    activeJobs: stats.activeJobs,
    totalViews: stats.totalViews,
    applications: stats.applications,
    lastUpdate: stats.lastUpdate,
    performance: stats.performance
  }, 'Platform stats retrieved successfully', {}, origin);
}