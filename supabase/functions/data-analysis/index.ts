// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('data-analysis');

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface DataAnalysisRequest {
  query: string;
  analysisType: 'trend' | 'comparison' | 'prediction' | 'optimization' | 'insights' | 'custom';
  timeframe?: string;
  includeRecommendations?: boolean;
  dataPoints?: string[];
  organizationId?: string;
  organizationName?: string;
}

const fetchCompleteDataset = async (organizationId?: string) => {
  try {
    logger.info('Fetching complete dataset for analysis', { organizationId: organizationId || 'all' });

    // Build queries with organization filter
    const applicationsQuery = supabase.from('applications').select(`
      *,
      job_listings!inner(title, platform_id, job_type, organization_id, created_at, platforms(name))
    `).order('applied_at', { ascending: false });

    const jobsQuery = supabase.from('job_listings').select(`
      *,
      platforms(name),
      job_categories(name),
      daily_spend(amount, date, clicks, views)
    `).order('created_at', { ascending: false });

    const spendQuery = supabase.from('daily_spend').select(`
      *,
      job_listings!inner(title, platform_id, organization_id, platforms(name))
    `).order('date', { ascending: false });

    const clientsQuery = supabase.from('clients').select('*').order('created_at', { ascending: false });

    // Apply organization filter if provided
    if (organizationId) {
      applicationsQuery.eq('job_listings.organization_id', organizationId);
      jobsQuery.eq('organization_id', organizationId);
      spendQuery.eq('job_listings.organization_id', organizationId);
      clientsQuery.eq('organization_id', organizationId);
    }

    // Fetch all relevant data in parallel
    const [applicationsResult, jobsResult, spendResult, clientsResult, platformsResult] = await Promise.all([
      applicationsQuery,
      jobsQuery,
      spendQuery,
      clientsQuery,
      supabase.from('platforms').select('*')
    ]);

    return {
      applications: applicationsResult.data || [],
      jobs: jobsResult.data || [],
      spend: spendResult.data || [],
      clients: clientsResult.data || [],
      platforms: platformsResult.data || [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalRecords: {
          applications: applicationsResult.data?.length || 0,
          jobs: jobsResult.data?.length || 0,
          spend: spendResult.data?.length || 0,
          clients: clientsResult.data?.length || 0,
          platforms: platformsResult.data?.length || 0
        }
      }
    };
  } catch (error) {
    logger.error('Error fetching dataset', error);
    throw error;
  }
};

const generateDataSummary = (data: any) => {
  const summary = {
    overview: {
      totalApplications: data.applications.length,
      totalJobs: data.jobs.length,
      totalSpend: data.spend.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
      totalClients: data.clients.length,
      activePlatforms: data.platforms.length
    },
    timeframes: {
      last7Days: {
        applications: data.applications.filter((app: any) => {
          const appDate = new Date(app.applied_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo;
        }).length,
        spend: data.spend.filter((spend: any) => {
          const spendDate = new Date(spend.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return spendDate >= weekAgo;
        }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      },
      last30Days: {
        applications: data.applications.filter((app: any) => {
          const appDate = new Date(app.applied_at);
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          return appDate >= monthAgo;
        }).length,
        spend: data.spend.filter((spend: any) => {
          const spendDate = new Date(spend.date);
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          return spendDate >= monthAgo;
        }).reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      }
    },
    topPerformers: {
      platforms: data.platforms.map((platform: any) => ({
        name: platform.name,
        jobCount: data.jobs.filter((job: any) => job.platform_id === platform.id).length,
        applicationCount: data.applications.filter((app: any) => 
          app.job_listings?.platform_id === platform.id
        ).length
      })).sort((a: any, b: any) => b.applicationCount - a.applicationCount).slice(0, 3),
      
      jobSources: data.applications.reduce((acc: any, app: any) => {
        const source = app.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {})
    }
  };

  return summary;
};

const createAnalysisPrompt = (query: string, data: any, summary: any, analysisType: string) => {
  const basePrompt = `You are an expert data analyst specializing in recruitment marketing analytics. You have access to comprehensive recruitment data including applications, job postings, spending, and platform performance.

**ANALYSIS REQUEST:** ${query}
**ANALYSIS TYPE:** ${analysisType}

**DATA SUMMARY:**
- Total Applications: ${summary.overview.totalApplications}
- Total Jobs Posted: ${summary.overview.totalJobs}
- Total Spend: $${summary.overview.totalSpend.toFixed(2)}
- Active Platforms: ${summary.overview.activePlatforms}

**RECENT PERFORMANCE (Last 7 days):**
- Applications: ${summary.timeframes.last7Days.applications}
- Spend: $${summary.timeframes.last7Days.spend.toFixed(2)}

**TOP PERFORMING PLATFORMS:**
${summary.topPerformers.platforms.map((p: any) => `- ${p.name}: ${p.applicationCount} applications`).join('\n')}

**DETAILED DATA SAMPLE:**
Applications (Recent 5): ${JSON.stringify(data.applications.slice(0, 5), null, 2)}
Jobs (Recent 5): ${JSON.stringify(data.jobs.slice(0, 5), null, 2)}
Spending (Recent 5): ${JSON.stringify(data.spend.slice(0, 5), null, 2)}

**ANALYSIS INSTRUCTIONS:**
1. Provide deep insights based on the data patterns you observe
2. Identify trends, anomalies, and optimization opportunities
3. Calculate key performance metrics (Cost per Application, ROI, conversion rates)
4. Offer specific, actionable recommendations
5. Highlight both strengths and areas for improvement
6. Use data-driven conclusions with specific numbers and percentages
7. Structure your response with clear sections: Insights, Metrics, Trends, Recommendations

**RESPONSE FORMAT:**
Provide a comprehensive analysis that includes:
- **Key Insights:** 3-5 main findings
- **Performance Metrics:** Calculated KPIs and ratios
- **Trend Analysis:** Patterns over time
- **Recommendations:** Specific action items with expected impact
- **Risk Assessment:** Potential issues or concerns

Be specific with numbers and provide context for all metrics.`;

  return basePrompt;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      analysisType = 'insights',
      timeframe = 'last30days',
      includeRecommendations = true,
      dataPoints = [],
      organizationId,
      organizationName
    }: DataAnalysisRequest = await req.json();

    logger.info('Data analysis request', { query: query.substring(0, 100), analysisType, timeframe, organizationName });

    // Fetch complete dataset with organization filter
    const dataset = await fetchCompleteDataset(organizationId);
    logger.info('Dataset fetched', { metadata: dataset.metadata, organizationName: organizationName || 'all' });

    // Generate data summary
    const summary = generateDataSummary(dataset);
    logger.info('Data summary generated');

    // Create analysis prompt
    const analysisPrompt = createAnalysisPrompt(query, dataset, summary, analysisType);

    // Call OpenAI for analysis
    logger.info('Sending to OpenAI for analysis...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert recruitment marketing data analyst. Provide comprehensive, actionable insights based on recruitment data.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI API error', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis generated from OpenAI');
    }

    // Prepare response with analysis and supporting data
    const result = {
      analysis,
      metadata: {
        query,
        analysisType,
        timeframe,
        dataPoints: dataset.metadata,
        generatedAt: new Date().toISOString()
      },
      summary,
      insights: {
        keyMetrics: {
          costPerApplication: summary.overview.totalSpend / summary.overview.totalApplications,
          applicationRate: (summary.timeframes.last7Days.applications / 7).toFixed(1),
          spendPerDay: (summary.timeframes.last7Days.spend / 7).toFixed(2),
          platformEfficiency: summary.topPerformers.platforms
        },
        trends: {
          weeklyGrowth: {
            applications: ((summary.timeframes.last7Days.applications / (summary.timeframes.last30Days.applications / 4)) - 1) * 100,
            spend: ((summary.timeframes.last7Days.spend / (summary.timeframes.last30Days.spend / 4)) - 1) * 100
          }
        }
      }
    };

    logger.info('Analysis completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Error in data-analysis function', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      analysis: "I encountered an error while analyzing your data. Please try again or contact support if the issue persists."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});