import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('trucking-platform-integration')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, platform } = await req.json()
    
    logger.info('Processing request', { action, platform })

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    switch (action) {
      case 'check_connection':
        return await checkPlatformConnection(platform)
      
      case 'post_job':
        return await postJobToPlatform(platform, supabaseClient)
      
      case 'get_platform_stats':
        return await getPlatformStats(platform, supabaseClient)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error: unknown) {
    logger.error('Trucking platform integration error', error)
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function checkPlatformConnection(platform: string) {
  logger.info('Checking connection', { platform })
  
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

  return new Response(
    JSON.stringify({
      platform: config.name,
      connected: config.connected,
      feedSupported: config.feedSupported,
      features: config.features,
      lastChecked: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function postJobToPlatform(platform: string, _supabaseClient: ReturnType<typeof createClient>) {
  logger.info('Posting job to platform', { platform })
  
  // For free platforms, we primarily use XML feeds
  // This function simulates the posting process
  
  const result = {
    success: true,
    message: `Job successfully syndicated to ${platform} via XML feed`,
    platform,
    method: 'XML Feed Syndication',
    timestamp: new Date().toISOString()
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPlatformStats(platform: string, _supabaseClient: ReturnType<typeof createClient>) {
  logger.info('Getting stats for platform', { platform })
  
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

  return new Response(
    JSON.stringify(stats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}