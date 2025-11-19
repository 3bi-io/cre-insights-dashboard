// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Meta Spend Analytics function called');
    
    // Get auth header safely
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: ' + (userError?.message || 'No user found'));
    }

    const body = await req.json().catch(() => ({}));
    const { analysisType = 'overview', dateRange = 'last_30d' } = body;

    // Fetch meta ad sets data
    const { data: adSets, error: adSetsError } = await supabaseClient
      .from('meta_ad_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (adSetsError) throw adSetsError;

    // Fetch meta campaigns data for context
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('meta_campaigns')
      .select('*')
      .eq('user_id', user.id);

    if (campaignsError) throw campaignsError;

    // Fetch meta ads data for context
    const { data: ads, error: adsError } = await supabaseClient
      .from('meta_ads')
      .select('*')
      .eq('user_id', user.id);

    if (adsError) throw adsError;

    console.log(`Analyzing ${adSets.length} ad sets, ${campaigns.length} campaigns, ${ads.length} ads`);

    // Calculate aggregate metrics
    const totalSpend = adSets.reduce((sum, adSet) => sum + (parseFloat(adSet.spend) || 0), 0);
    const totalImpressions = adSets.reduce((sum, adSet) => sum + (adSet.impressions || 0), 0);
    const totalClicks = adSets.reduce((sum, adSet) => sum + (adSet.clicks || 0), 0);
    const totalReach = adSets.reduce((sum, adSet) => sum + (adSet.reach || 0), 0);
    const totalResults = adSets.reduce((sum, adSet) => sum + (parseInt(adSet.results) || 0), 0);
    const costPerResult = totalResults > 0 ? totalSpend / totalResults : 0;

    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgFrequency = totalReach > 0 ? totalImpressions / totalReach : 0;

    // Top performing ad sets
    const topAdSetsBySpend = adSets
      .filter(adSet => parseFloat(adSet.spend) > 0)
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))
      .slice(0, 5);

    const topAdSetsByCTR = adSets
      .filter(adSet => parseFloat(adSet.ctr) > 0)
      .sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr))
      .slice(0, 5);

    // Performance distribution
    const spendDistribution = adSets.map(adSet => ({
      name: adSet.adset_name || `AdSet ${adSet.adset_id}`,
      spend: parseFloat(adSet.spend) || 0,
      impressions: adSet.impressions || 0,
      clicks: adSet.clicks || 0,
      ctr: parseFloat(adSet.ctr) || 0,
      cpm: parseFloat(adSet.cpm) || 0,
      cpc: parseFloat(adSet.cpc) || 0
    }));

    // Campaign-level aggregation
    const campaignPerformance = campaigns.map(campaign => {
      const campaignAdSets = adSets.filter(adSet => adSet.campaign_id === campaign.campaign_id);
      const campaignSpend = campaignAdSets.reduce((sum, adSet) => sum + (parseFloat(adSet.spend) || 0), 0);
      const campaignImpressions = campaignAdSets.reduce((sum, adSet) => sum + (adSet.impressions || 0), 0);
      const campaignClicks = campaignAdSets.reduce((sum, adSet) => sum + (adSet.clicks || 0), 0);
      
      return {
        name: campaign.campaign_name || `Campaign ${campaign.campaign_id}`,
        spend: campaignSpend,
        impressions: campaignImpressions,
        clicks: campaignClicks,
        ctr: campaignImpressions > 0 ? (campaignClicks / campaignImpressions) * 100 : 0,
        adSetsCount: campaignAdSets.length
      };
    }).sort((a, b) => b.spend - a.spend);

    // Prepare data for AI analysis
    const dataForAI = {
      summary: {
        totalAdSets: adSets.length,
        totalCampaigns: campaigns.length,
        totalAds: ads.length,
        totalSpend: totalSpend,
        totalImpressions: totalImpressions,
        totalClicks: totalClicks,
        totalReach: totalReach,
        totalResults: totalResults,
        costPerResult: costPerResult,
        avgCTR: avgCTR,
        avgCPM: avgCPM,
        avgCPC: avgCPC,
        avgFrequency: avgFrequency
      },
      topPerformers: {
        bySpend: topAdSetsBySpend.slice(0, 3).map(adSet => ({
          name: adSet.adset_name || `AdSet ${adSet.adset_id}`,
          spend: parseFloat(adSet.spend),
          ctr: parseFloat(adSet.ctr),
          cpm: parseFloat(adSet.cpm)
        })),
        byCTR: topAdSetsByCTR.slice(0, 3).map(adSet => ({
          name: adSet.adset_name || `AdSet ${adSet.adset_id}`,
          ctr: parseFloat(adSet.ctr),
          spend: parseFloat(adSet.spend),
          impressions: adSet.impressions
        }))
      },
      campaignPerformance: campaignPerformance.slice(0, 5),
      performanceDistribution: {
        spendRange: {
          min: Math.min(...spendDistribution.map(d => d.spend)),
          max: Math.max(...spendDistribution.map(d => d.spend)),
          avg: totalSpend / adSets.length
        },
        ctrRange: {
          min: Math.min(...spendDistribution.map(d => d.ctr)),
          max: Math.max(...spendDistribution.map(d => d.ctr)),
          avg: avgCTR
        }
      }
    };

    const prompt = `
As a Meta advertising expert and performance marketing analyst, analyze this Facebook/Instagram ad campaign data and provide:

1. 5-7 key insights about performance patterns, spending efficiency, and audience engagement
2. 5-7 specific actionable recommendations to optimize ad spend, improve CTR, reduce CPC, and scale successful campaigns

Meta Advertising Performance Data:
${JSON.stringify(dataForAI, null, 2)}

Context:
- This is trucking/logistics industry recruitment advertising
- CTR above 1.5% is considered good for this industry
- CPM under $15 is competitive
- CPC under $2 is optimal for job application conversions
- Cost per result under $50 is excellent for recruitment
- Total results generated: ${totalResults}
- Cost per result: $${costPerResult.toFixed(2)}

Focus on:
- Spend efficiency and budget allocation
- Creative and audience performance
- Scaling opportunities for top performers
- Cost optimization strategies
- Campaign structure improvements

Format your response as a JSON object:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "summary": "One-sentence overall assessment"
}
`;

    // Get OpenAI analysis
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key is not configured');

    console.log('Calling OpenAI API for Meta spend analysis');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a Meta advertising expert specializing in performance marketing for the trucking and logistics recruitment industry. You have deep knowledge of Facebook/Instagram advertising metrics, optimization strategies, and industry benchmarks.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    let insights = ['No insights generated'];
    let recommendations = ['No recommendations generated'];
    let summary = 'Analysis completed';

    try {
      const analysisText = aiResponse.choices[0]?.message?.content;
      const analysis = JSON.parse(analysisText);
      insights = analysis.insights || insights;
      recommendations = analysis.recommendations || recommendations;
      summary = analysis.summary || summary;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Provide fallback insights
      insights = [
        `Analyzed ${adSets.length} ad sets across ${campaigns.length} campaigns`,
        `Total spend: $${totalSpend.toFixed(2)} with ${totalImpressions.toLocaleString()} impressions`,
        `Average CTR: ${avgCTR.toFixed(2)}% ${avgCTR > 1.5 ? '(Good performance)' : '(Needs improvement)'}`,
        `Average CPC: $${avgCPC.toFixed(2)} ${avgCPC < 2 ? '(Efficient)' : '(Consider optimization)'}`,
        `Top spending ad set: ${topAdSetsBySpend[0]?.adset_name || 'Unknown'} ($${parseFloat(topAdSetsBySpend[0]?.spend || 0).toFixed(2)})`
      ];
      
      recommendations = [
        'Review and optimize underperforming ad sets with high spend but low CTR',
        'Scale budget allocation to top-performing ad sets by CTR and cost efficiency',
        'Test new creative variations for ad sets showing audience fatigue',
        'Implement automated rules for budget optimization based on performance metrics',
        'Consider geographic or demographic audience refinements for better targeting'
      ];
    }

    const result = {
      summary: dataForAI.summary,
      topPerformers: dataForAI.topPerformers,
      campaignPerformance,
      spendDistribution,
      insights,
      recommendations,
      aiSummary: summary,
      generatedAt: new Date().toISOString()
    };

    console.log('Meta spend analysis complete');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in meta-spend-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze Meta spend data',
        details: error.message 
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
});