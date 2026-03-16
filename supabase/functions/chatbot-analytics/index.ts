import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('chatbot-analytics');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AnalyticsQuery {
  query: string;
  context?: string;
  organizationId?: string;
  organizationName?: string;
}

const analyzeQuery = (query: string): { tables: string[], intent: string, queryType: string } => {
  const lowercaseQuery = query.toLowerCase();
  const tables: string[] = [];
  let intent = 'general';
  let queryType = 'summary';

  // Detect table mentions
  if (lowercaseQuery.includes('application') || lowercaseQuery.includes('applicant')) {
    tables.push('applications');
  }
  if (lowercaseQuery.includes('job') || lowercaseQuery.includes('listing')) {
    tables.push('job_listings');
  }
  if (lowercaseQuery.includes('spend') || lowercaseQuery.includes('budget') || lowercaseQuery.includes('cost')) {
    tables.push('daily_spend');
  }
  if (lowercaseQuery.includes('client') || lowercaseQuery.includes('customer')) {
    tables.push('clients');
  }
  if (lowercaseQuery.includes('platform')) {
    tables.push('platforms');
  }
  if (lowercaseQuery.includes('category') || lowercaseQuery.includes('categories')) {
    tables.push('job_categories');
  }
  if (lowercaseQuery.includes('user') || lowercaseQuery.includes('profile')) {
    tables.push('profiles', 'user_roles');
  }

  // Detect intent
  if (lowercaseQuery.includes('trend') || lowercaseQuery.includes('over time') || lowercaseQuery.includes('growth')) {
    intent = 'trends';
  } else if (lowercaseQuery.includes('compare') || lowercaseQuery.includes('vs') || lowercaseQuery.includes('versus')) {
    intent = 'comparison';
  } else if (lowercaseQuery.includes('performance') || lowercaseQuery.includes('metrics') || lowercaseQuery.includes('kpi')) {
    intent = 'performance';
  } else if (lowercaseQuery.includes('breakdown') || lowercaseQuery.includes('distribution')) {
    intent = 'breakdown';
  }

  // Detect query type
  if (lowercaseQuery.includes('count') || lowercaseQuery.includes('how many') || lowercaseQuery.includes('number of')) {
    queryType = 'count';
  } else if (lowercaseQuery.includes('average') || lowercaseQuery.includes('avg') || lowercaseQuery.includes('mean')) {
    queryType = 'average';
  } else if (lowercaseQuery.includes('total') || lowercaseQuery.includes('sum')) {
    queryType = 'sum';
  } else if (lowercaseQuery.includes('list') || lowercaseQuery.includes('show me') || lowercaseQuery.includes('what are')) {
    queryType = 'list';
  }

  return { tables, intent, queryType };
};

const getApplicationsAnalytics = async (organizationId?: string) => {
  try {
    let query = supabase.from('applications').select(`
      *,
      job_listings!inner(title, platform_id, organization_id, platforms(name))
    `);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('job_listings.organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const byStatus = data?.reduce((acc: any, app: any) => {
      acc[app.status || 'unknown'] = (acc[app.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const bySource = data?.reduce((acc: any, app: any) => {
      acc[app.source || 'unknown'] = (acc[app.source || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const recentApplications = data?.filter((app: any) => {
      const appDate = new Date(app.applied_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return appDate >= weekAgo;
    }).length || 0;

    return {
      total,
      byStatus,
      bySource,
      recentApplications,
      data: data?.slice(0, 5) // Recent 5 for context
    };
  } catch (error) {
    logger.error('Error fetching applications analytics', error);
    return null;
  }
};

const getJobsAnalytics = async (organizationId?: string) => {
  try {
    let query = supabase.from('job_listings').select(`
      *,
      platforms(name),
      job_categories(name),
      daily_spend(amount, date)
    `);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const activeJobs = data?.filter((job: any) => job.status === 'active').length || 0;
    
    const byPlatform = data?.reduce((acc: any, job: any) => {
      const platform = job.platforms?.name || 'Unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    const totalSpend = data?.reduce((acc: number, job: any) => {
      const jobSpend = job.daily_spend?.reduce((sum: number, spend: any) => sum + (spend.amount || 0), 0) || 0;
      return acc + jobSpend;
    }, 0) || 0;

    return {
      total,
      activeJobs,
      byPlatform,
      totalSpend: totalSpend.toFixed(2),
      data: data?.slice(0, 5)
    };
  } catch (error) {
    logger.error('Error fetching jobs analytics', error);
    return null;
  }
};

const getSpendAnalytics = async (organizationId?: string) => {
  try {
    let query = supabase.from('daily_spend').select(`
      *,
      job_listings!inner(title, organization_id, platforms(name))
    `);

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('job_listings.organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalSpend = data?.reduce((acc: number, spend: any) => acc + (spend.amount || 0), 0) || 0;
    const totalClicks = data?.reduce((acc: number, spend: any) => acc + (spend.clicks || 0), 0) || 0;
    const totalViews = data?.reduce((acc: number, spend: any) => acc + (spend.views || 0), 0) || 0;

    const avgCostPerClick = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0';
    const avgCostPerView = totalViews > 0 ? (totalSpend / totalViews).toFixed(4) : '0';

    const recentSpend = data?.filter((spend: any) => {
      const spendDate = new Date(spend.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return spendDate >= weekAgo;
    }).reduce((acc: number, spend: any) => acc + (spend.amount || 0), 0) || 0;

    return {
      totalSpend: totalSpend.toFixed(2),
      totalClicks,
      totalViews,
      avgCostPerClick,
      avgCostPerView,
      recentSpend: recentSpend.toFixed(2)
    };
  } catch (error) {
    logger.error('Error fetching spend analytics', error);
    return null;
  }
};

const getClientsAnalytics = async () => {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;

    const total = data?.length || 0;
    const active = data?.filter((client: any) => client.status === 'active').length || 0;
    
    const byStatus = data?.reduce((acc: any, client: any) => {
      acc[client.status || 'unknown'] = (acc[client.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    return { total, active, byStatus };
  } catch (error) {
    logger.error('Error fetching clients analytics', error);
    return null;
  }
};

const generateAnalyticalResponse = async (query: string, analytics: any): Promise<string> => {
  const { tables, intent, queryType } = analyzeQuery(query);
  
  let response = `Based on your query about ${tables.join(', ') || 'the system'}, here's what I found:\n\n`;

  if (tables.includes('applications') && analytics.applications) {
    const apps = analytics.applications;
    response += `📊 **Applications Overview:**\n`;
    response += `• Total Applications: ${apps.total}\n`;
    response += `• Recent (7 days): ${apps.recentApplications}\n`;
    response += `• Status Breakdown: ${Object.entries(apps.byStatus).map(([status, count]) => `${status}: ${count}`).join(', ')}\n`;
    response += `• Top Sources: ${Object.entries(apps.bySource).slice(0, 3).map(([source, count]) => `${source}: ${count}`).join(', ')}\n\n`;
  }

  if (tables.includes('job_listings') && analytics.jobs) {
    const jobs = analytics.jobs;
    response += `💼 **Job Listings Overview:**\n`;
    response += `• Total Jobs: ${jobs.total}\n`;
    response += `• Active Jobs: ${jobs.activeJobs}\n`;
    response += `• Platform Distribution: ${Object.entries(jobs.byPlatform).map(([platform, count]) => `${platform}: ${count}`).join(', ')}\n`;
    response += `• Total Spend: $${jobs.totalSpend}\n\n`;
  }

  if (tables.includes('daily_spend') && analytics.spend) {
    const spend = analytics.spend;
    response += `💰 **Spending Analytics:**\n`;
    response += `• Total Spend: $${spend.totalSpend}\n`;
    response += `• Recent Spend (7 days): $${spend.recentSpend}\n`;
    response += `• Total Clicks: ${spend.totalClicks}\n`;
    response += `• Total Views: ${spend.totalViews}\n`;
    response += `• Avg Cost per Click: $${spend.avgCostPerClick}\n`;
    response += `• Avg Cost per View: $${spend.avgCostPerView}\n\n`;
  }

  if (tables.includes('clients') && analytics.clients) {
    const clients = analytics.clients;
    response += `👥 **Clients Overview:**\n`;
    response += `• Total Clients: ${clients.total}\n`;
    response += `• Active Clients: ${clients.active}\n`;
    response += `• Status Breakdown: ${Object.entries(clients.byStatus).map(([status, count]) => `${status}: ${count}`).join(', ')}\n\n`;
  }

  // Add insights based on intent
  response += `💡 **Key Insights:**\n`;
  
  if (intent === 'performance' && analytics.spend && analytics.applications) {
    const costPerApp = analytics.applications.total > 0 ? 
      (parseFloat(analytics.spend.totalSpend) / analytics.applications.total).toFixed(2) : '0';
    response += `• Cost per Application: $${costPerApp}\n`;
  }

  if (intent === 'trends' && analytics.applications) {
    const recentPercentage = analytics.applications.total > 0 ? 
      ((analytics.applications.recentApplications / analytics.applications.total) * 100).toFixed(1) : '0';
    response += `• Recent application activity: ${recentPercentage}% of total applications came in the last 7 days\n`;
  }

  if (analytics.jobs && analytics.applications) {
    const appsPerJob = analytics.jobs.total > 0 ? 
      (analytics.applications.total / analytics.jobs.total).toFixed(1) : '0';
    response += `• Average Applications per Job: ${appsPerJob}\n`;
  }

  response += `\nWould you like me to dive deeper into any specific area or provide more detailed analysis?`;

  return response;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context, organizationId, organizationName }: AnalyticsQuery = await req.json();

    logger.info('Received analytics query', { query: query.substring(0, 100), organizationName: organizationName || 'all' });

    // Analyze the query to determine what data to fetch
    const { tables } = analyzeQuery(query);

    // Fetch relevant analytics data with organization filter
    const analytics: any = {};

    if (tables.includes('applications') || tables.length === 0) {
      analytics.applications = await getApplicationsAnalytics(organizationId);
    }

    if (tables.includes('job_listings') || tables.length === 0) {
      analytics.jobs = await getJobsAnalytics(organizationId);
    }

    if (tables.includes('daily_spend') || tables.length === 0) {
      analytics.spend = await getSpendAnalytics(organizationId);
    }

    if (tables.includes('clients') || tables.length === 0) {
      analytics.clients = await getClientsAnalytics(organizationId);
    }

    // Generate analytical response
    const response = await generateAnalyticalResponse(query, analytics);

    logger.info('Generated analytics response', { organizationName: organizationName || 'all' });

    return new Response(JSON.stringify({ 
      response,
      analytics,
      detectedTables: tables
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    logger.error('Error in chatbot-analytics function', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: message,
      response: "I'm sorry, I encountered an error while analyzing your data. Please try rephrasing your question or contact support if the issue persists."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});