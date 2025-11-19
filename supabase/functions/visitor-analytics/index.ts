import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url);
    const startdate = url.searchParams.get('startdate');
    const enddate = url.searchParams.get('enddate');

    console.log(`Fetching real visitor analytics from ${startdate} to ${enddate}`);

    const start = startdate ? new Date(startdate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = enddate ? new Date(enddate) : new Date();

    // Query page views within date range
    const { data: pageViews, error: pageViewsError } = await supabaseClient
      .from('page_views')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (pageViewsError) throw pageViewsError;

    // Query visitor sessions within date range
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('visitor_sessions')
      .select('*')
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString());

    if (sessionsError) throw sessionsError;

    // Process data by date for time series
    const dateMap = new Map();
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        visitors: new Set(),
        pageviews: 0,
        sessionDurations: [],
        bounces: 0,
        totalSessions: 0
      });
    }

    // Aggregate page views by date
    (pageViews || []).forEach((pv: any) => {
      const date = new Date(pv.created_at).toISOString().split('T')[0];
      if (dateMap.has(date)) {
        const dayData = dateMap.get(date);
        dayData.visitors.add(pv.visitor_id);
        dayData.pageviews++;
      }
    });

    // Aggregate sessions by date
    (sessions || []).forEach((session: any) => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      if (dateMap.has(date)) {
        const dayData = dateMap.get(date);
        dayData.totalSessions++;
        if (session.duration_seconds) {
          dayData.sessionDurations.push(session.duration_seconds);
        }
        if (session.bounced) {
          dayData.bounces++;
        }
      }
    });

    // Convert to time series format
    const visitorsData = [];
    const pageviewsData = [];
    const sessionDurationData = [];
    const bounceRateData = [];

    for (const [date, data] of dateMap.entries()) {
      visitorsData.push({ date, value: data.visitors.size });
      pageviewsData.push({ date, value: data.pageviews });
      
      const avgDuration = data.sessionDurations.length > 0
        ? Math.floor(data.sessionDurations.reduce((a, b) => a + b, 0) / data.sessionDurations.length)
        : 0;
      sessionDurationData.push({ date, value: avgDuration });
      
      const bounceRate = data.totalSessions > 0
        ? Math.floor((data.bounces / data.totalSessions) * 100)
        : 0;
      bounceRateData.push({ date, value: bounceRate });
    }

    // Calculate totals
    const totalVisitors = new Set((pageViews || []).map((pv: any) => pv.visitor_id)).size;
    const totalPageviews = (pageViews || []).length;
    const avgSessionDuration = (sessions || []).length > 0
      ? Math.floor((sessions || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / (sessions || []).length)
      : 0;
    const avgBounceRate = (sessions || []).length > 0
      ? Math.floor(((sessions || []).filter((s: any) => s.bounced).length / (sessions || []).length) * 100)
      : 0;

    // Aggregate by page path
    const pageCounts = new Map();
    (pageViews || []).forEach((pv: any) => {
      pageCounts.set(pv.page_path, (pageCounts.get(pv.page_path) || 0) + 1);
    });
    const topPages = Array.from(pageCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Aggregate by source
    const sourceCounts = new Map();
    (sessions || []).forEach((s: any) => {
      sourceCounts.set(s.source, (sourceCounts.get(s.source) || 0) + 1);
    });
    const sources = Array.from(sourceCounts.entries())
      .map(([label, value]) => ({ label, value }));

    // Aggregate by device
    const deviceCounts = new Map();
    (sessions || []).forEach((s: any) => {
      deviceCounts.set(s.device_type, (deviceCounts.get(s.device_type) || 0) + 1);
    });
    const devices = Array.from(deviceCounts.entries())
      .map(([label, value]) => ({ label, value }));

    // Aggregate by country
    const countryCounts = new Map();
    (sessions || []).forEach((s: any) => {
      countryCounts.set(s.country, (countryCounts.get(s.country) || 0) + 1);
    });
    const countries = Array.from(countryCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

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
          data: topPages
        },
        source: {
          data: sources
        },
        device: {
          data: devices
        },
        country: {
          data: countries
        }
      }
    };

    console.log('Successfully fetched real visitor analytics data:', {
      totalVisitors,
      totalPageviews,
      totalSessions: (sessions || []).length
    });

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
