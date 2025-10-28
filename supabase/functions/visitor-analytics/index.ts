import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const startdate = url.searchParams.get('startdate');
    const enddate = url.searchParams.get('enddate');
    const granularity = url.searchParams.get('granularity') || 'daily';

    console.log(`Fetching visitor analytics from ${startdate} to ${enddate} with granularity ${granularity}`);

    // Calculate number of days
    const start = startdate ? new Date(startdate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = enddate ? new Date(enddate) : new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

    // Generate realistic mock data
    const generateTimeSeriesData = (days: number, baseValue: number, variance: number) => {
      const data = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const randomVariance = Math.floor(Math.random() * variance * 2 - variance);
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, baseValue + randomVariance)
        });
      }
      return data;
    };

    // Generate data for different metrics
    const visitorsData = generateTimeSeriesData(days, 1200, 300);
    const pageviewsData = generateTimeSeriesData(days, 3500, 800);
    const sessionDurationData = generateTimeSeriesData(days, 180, 60);
    const bounceRateData = generateTimeSeriesData(days, 45, 15);

    // Calculate totals
    const totalVisitors = visitorsData.reduce((sum, item) => sum + item.value, 0);
    const totalPageviews = pageviewsData.reduce((sum, item) => sum + item.value, 0);
    const avgSessionDuration = Math.floor(sessionDurationData.reduce((sum, item) => sum + item.value, 0) / sessionDurationData.length);
    const avgBounceRate = Math.floor(bounceRateData.reduce((sum, item) => sum + item.value, 0) / bounceRateData.length);

    const analyticsData = {
      timeSeries: {
        visitors: {
          data: visitorsData,
          total: totalVisitors
        },
        pageviews: {
          data: pageviewsData,
          total: totalPageviews
        },
        sessionDuration: {
          data: sessionDurationData,
          total: avgSessionDuration
        },
        bounceRate: {
          data: bounceRateData,
          total: avgBounceRate
        },
        pageviewsPerVisit: {
          total: totalVisitors > 0 ? totalPageviews / totalVisitors : 0
        }
      },
      lists: {
        page: {
          data: [
            { label: '/dashboard', value: Math.floor(totalPageviews * 0.25) },
            { label: '/applications', value: Math.floor(totalPageviews * 0.20) },
            { label: '/job-listings', value: Math.floor(totalPageviews * 0.15) },
            { label: '/clients', value: Math.floor(totalPageviews * 0.12) },
            { label: '/analytics', value: Math.floor(totalPageviews * 0.10) },
            { label: '/routes', value: Math.floor(totalPageviews * 0.08) },
            { label: '/settings', value: Math.floor(totalPageviews * 0.05) },
            { label: '/voice-agent', value: Math.floor(totalPageviews * 0.03) },
            { label: '/campaigns', value: Math.floor(totalPageviews * 0.02) }
          ]
        },
        source: {
          data: [
            { label: 'Direct', value: Math.floor(totalVisitors * 0.40) },
            { label: 'Search', value: Math.floor(totalVisitors * 0.30) },
            { label: 'Social', value: Math.floor(totalVisitors * 0.15) },
            { label: 'Referral', value: Math.floor(totalVisitors * 0.10) },
            { label: 'Email', value: Math.floor(totalVisitors * 0.05) }
          ]
        },
        device: {
          data: [
            { label: 'desktop', value: Math.floor(totalVisitors * 0.55) },
            { label: 'mobile', value: Math.floor(totalVisitors * 0.35) },
            { label: 'tablet', value: Math.floor(totalVisitors * 0.10) }
          ]
        },
        country: {
          data: [
            { label: 'United States', value: Math.floor(totalVisitors * 0.65) },
            { label: 'Canada', value: Math.floor(totalVisitors * 0.15) },
            { label: 'United Kingdom', value: Math.floor(totalVisitors * 0.08) },
            { label: 'Australia', value: Math.floor(totalVisitors * 0.05) },
            { label: 'Germany', value: Math.floor(totalVisitors * 0.04) },
            { label: 'Other', value: Math.floor(totalVisitors * 0.03) }
          ]
        }
      }
    };

    console.log('Successfully generated visitor analytics data');

    return new Response(
      JSON.stringify(analyticsData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in visitor-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to fetch analytics data'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})
