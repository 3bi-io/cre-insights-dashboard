import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Parse browser from user agent
const parseBrowser = (ua: string): string => {
  if (!ua) return 'Unknown';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  return 'Other';
};

// Parse OS from user agent
const parseOS = (ua: string): string => {
  if (!ua) return 'Unknown';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other';
};

// Extract domain from referrer URL
const extractDomain = (url: string): string => {
  if (!url) return 'Direct';
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url.substring(0, 50);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS for analytics aggregation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse dates from request body (POST) or query params (GET)
    let startdate: string | null = null;
    let enddate: string | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        startdate = body.startdate || null;
        enddate = body.enddate || null;
        console.log('Parsed dates from request body:', { startdate, enddate });
      } catch (e) {
        console.log('No JSON body or parse error, falling back to query params');
      }
    }

    // Fall back to query params for GET requests or if body parsing failed
    if (!startdate || !enddate) {
      const url = new URL(req.url);
      startdate = url.searchParams.get('startdate') || startdate;
      enddate = url.searchParams.get('enddate') || enddate;
      console.log('Using query params:', { startdate, enddate });
    }

    console.log(`Fetching enhanced visitor analytics from ${startdate} to ${enddate}`);

    const start = startdate ? new Date(startdate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = enddate ? new Date(enddate) : new Date();

    const { data: pageViews, error: pageViewsError } = await supabaseClient
      .from('page_views')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (pageViewsError) throw pageViewsError;

    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('visitor_sessions')
      .select('*')
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString());

    if (sessionsError) throw sessionsError;

    const dateMap = new Map();
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
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

    const visitorFirstSeen = new Map<string, Date>();
    const newVisitors = new Set<string>();
    const returningVisitors = new Set<string>();
    const browserCounts = new Map<string, number>();
    const osCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const hourlyDistribution = Array(24).fill(0);

    (pageViews || []).forEach((pv: any) => {
      const date = new Date(pv.created_at).toISOString().split('T')[0];
      if (dateMap.has(date)) {
        const dayData = dateMap.get(date);
        dayData.visitors.add(pv.visitor_id);
        dayData.pageviews++;
      }

      const pvDate = new Date(pv.created_at);
      if (!visitorFirstSeen.has(pv.visitor_id) || pvDate < visitorFirstSeen.get(pv.visitor_id)!) {
        visitorFirstSeen.set(pv.visitor_id, pvDate);
      }

      const browser = parseBrowser(pv.user_agent || '');
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);

      const os = parseOS(pv.user_agent || '');
      osCounts.set(os, (osCounts.get(os) || 0) + 1);

      const referrerDomain = extractDomain(pv.referrer || '');
      referrerCounts.set(referrerDomain, (referrerCounts.get(referrerDomain) || 0) + 1);

      const hour = new Date(pv.created_at).getHours();
      hourlyDistribution[hour]++;
    });

    const rangeStart = start.getTime();
    visitorFirstSeen.forEach((firstSeen, visitorId) => {
      if (firstSeen.getTime() >= rangeStart) {
        newVisitors.add(visitorId);
      } else {
        returningVisitors.add(visitorId);
      }
    });

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

    const visitorsData = [];
    const pageviewsData = [];
    const sessionDurationData = [];
    const bounceRateData = [];

    for (const [date, data] of dateMap.entries()) {
      visitorsData.push({ date, value: data.visitors.size });
      pageviewsData.push({ date, value: data.pageviews });
      
      const avgDuration = data.sessionDurations.length > 0
        ? Math.floor(data.sessionDurations.reduce((a: number, b: number) => a + b, 0) / data.sessionDurations.length)
        : 0;
      sessionDurationData.push({ date, value: avgDuration });
      
      const bounceRate = data.totalSessions > 0
        ? Math.floor((data.bounces / data.totalSessions) * 100)
        : 0;
      bounceRateData.push({ date, value: bounceRate });
    }

    const totalVisitors = new Set((pageViews || []).map((pv: any) => pv.visitor_id)).size;
    const totalPageviews = (pageViews || []).length;
    const totalSessions = (sessions || []).length;
    const avgSessionDuration = totalSessions > 0
      ? Math.floor((sessions || []).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / totalSessions)
      : 0;
    const avgBounceRate = totalSessions > 0
      ? Math.floor(((sessions || []).filter((s: any) => s.bounced).length / totalSessions) * 100)
      : 0;
    const avgPagesPerSession = totalSessions > 0
      ? (sessions || []).reduce((sum: number, s: any) => sum + (s.page_count || 1), 0) / totalSessions
      : 0;

    const pageData = new Map<string, { count: number; title: string }>();
    (pageViews || []).forEach((pv: any) => {
      const existing = pageData.get(pv.page_path);
      if (existing) {
        existing.count++;
      } else {
        pageData.set(pv.page_path, { count: 1, title: pv.page_title || pv.page_path });
      }
    });
    const topPages = Array.from(pageData.entries())
      .map(([path, data]) => ({ label: path, title: data.title, value: data.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const sourceCounts = new Map();
    (sessions || []).forEach((s: any) => {
      sourceCounts.set(s.source, (sourceCounts.get(s.source) || 0) + 1);
    });
    const sources = Array.from(sourceCounts.entries()).map(([label, value]) => ({ label, value }));

    const deviceCounts = new Map();
    (sessions || []).forEach((s: any) => {
      deviceCounts.set(s.device_type, (deviceCounts.get(s.device_type) || 0) + 1);
    });
    const devices = Array.from(deviceCounts.entries()).map(([label, value]) => ({ label, value }));

    const countryCounts = new Map();
    (sessions || []).forEach((s: any) => {
      countryCounts.set(s.country, (countryCounts.get(s.country) || 0) + 1);
    });
    const countries = Array.from(countryCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const browsers = Array.from(browserCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const operatingSystems = Array.from(osCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const referrers = Array.from(referrerCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    const recentActivity = (pageViews || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map((pv: any) => ({
        path: pv.page_path,
        title: pv.page_title || pv.page_path,
        time: pv.created_at,
        device: pv.device_type,
        country: pv.country || 'US',
        browser: parseBrowser(pv.user_agent || ''),
        visitorId: pv.visitor_id?.substring(0, 8) || 'unknown'
      }));

    const hourlyData = hourlyDistribution.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      value: count
    }));

    const analyticsData = {
      timeSeries: {
        visitors: { data: visitorsData, total: totalVisitors },
        pageviews: { data: pageviewsData, total: totalPageviews },
        sessionDuration: { data: sessionDurationData, total: avgSessionDuration },
        bounceRate: { data: bounceRateData, total: avgBounceRate },
        pageviewsPerVisit: { total: totalVisitors > 0 ? totalPageviews / totalVisitors : 0 }
      },
      lists: {
        page: { data: topPages },
        source: { data: sources },
        device: { data: devices },
        country: { data: countries },
        browser: { data: browsers },
        os: { data: operatingSystems },
        referrer: { data: referrers }
      },
      metrics: {
        totalSessions,
        avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
        newVisitors: newVisitors.size,
        returningVisitors: returningVisitors.size
      },
      hourlyDistribution: hourlyData,
      recentActivity
    };

    console.log('Successfully fetched enhanced visitor analytics data:', {
      totalVisitors, totalPageviews, totalSessions, browsers: browsers.length, referrers: referrers.length
    });

    return new Response(JSON.stringify(analyticsData), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in visitor-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message, message: 'Failed to fetch analytics data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
