import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CampaignOptimizationRequest {
  campaignId: string;
  analysisType: 'performance' | 'optimization' | 'prediction' | 'publisher_comparison';
  includeJobGroups?: boolean;
  includePublishers?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, analysisType, includeJobGroups = true, includePublishers = true }: CampaignOptimizationRequest = await req.json();

    if (!campaignId || !analysisType) {
      return new Response(
        JSON.stringify({ error: 'campaignId and analysisType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, organization_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job groups for this campaign
    let jobGroupsData = [];
    if (includeJobGroups) {
      const { data: jobGroups } = await supabase
        .from('job_groups')
        .select('*, job_group_assignments(job_listing_id)')
        .eq('campaign_id', campaignId);
      jobGroupsData = jobGroups || [];
    }

    // Fetch applications data for campaign jobs
    const { data: jobAssignments } = await supabase
      .from('campaign_job_assignments')
      .select('job_listing_id')
      .eq('campaign_id', campaignId);

    const jobListingIds = jobAssignments?.map(ja => ja.job_listing_id) || [];

    let applicationsData = [];
    if (jobListingIds.length > 0) {
      const { data: applications } = await supabase
        .from('applications')
        .select('status, applied_at, source')
        .in('job_listing_id', jobListingIds);
      applicationsData = applications || [];
    }

    // Build context for AI
    const context = {
      campaign: {
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        created_at: campaign.created_at,
      },
      jobGroups: jobGroupsData.map(jg => ({
        name: jg.name,
        publisher: jg.publisher,
        job_count: jg.job_group_assignments?.length || 0,
      })),
      applications: {
        total: applicationsData.length,
        by_status: applicationsData.reduce((acc, app) => {
          acc[app.status || 'unknown'] = (acc[app.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_source: applicationsData.reduce((acc, app) => {
          acc[app.source || 'unknown'] = (acc[app.source || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    // Create AI prompt based on analysis type
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'performance':
        systemPrompt = 'You are an expert campaign performance analyst specializing in recruitment advertising. Analyze campaign metrics and provide actionable insights.';
        userPrompt = `Analyze this recruitment campaign performance:\n\nCampaign: ${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Key performance insights (3-5 points)\n2. Areas of strength\n3. Areas needing improvement\n4. Specific metrics to track\n\nReturn response as JSON with keys: insights (array of strings), strengths (array), weaknesses (array), metrics (object).`;
        break;

      case 'optimization':
        systemPrompt = 'You are an expert campaign optimization specialist. Provide specific, actionable recommendations to improve campaign performance.';
        userPrompt = `Review this recruitment campaign and suggest optimizations:\n\nCampaign: ${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Top 5 optimization recommendations\n2. Expected impact for each (high/medium/low)\n3. Implementation difficulty (easy/moderate/hard)\n4. Estimated timeline for results\n\nReturn response as JSON with key: recommendations (array of objects with: title, description, impact, difficulty, timeline).`;
        break;

      case 'prediction':
        systemPrompt = 'You are a predictive analytics expert for recruitment campaigns. Forecast future performance based on current trends.';
        userPrompt = `Predict future performance for this campaign:\n\nCampaign: ${JSON.stringify(context, null, 2)}\n\nProvide:\n1. 30-day application volume forecast\n2. Expected cost per application trend\n3. Recommended budget adjustments\n4. Risk factors and opportunities\n\nReturn response as JSON with keys: forecast (object), trends (array), budget_recommendations (object), risks (array), opportunities (array).`;
        break;

      case 'publisher_comparison':
        systemPrompt = 'You are an expert in multi-platform recruitment advertising. Compare publisher performance and recommend optimal allocation.';
        userPrompt = `Analyze publisher performance for this campaign:\n\nCampaign: ${JSON.stringify(context, null, 2)}\n\nProvide:\n1. Publisher performance ranking\n2. Cost-effectiveness analysis\n3. Recommended budget allocation\n4. Underperforming publishers to pause\n5. High-potential publishers to expand\n\nReturn response as JSON with keys: publisher_ranking (array), cost_analysis (object), budget_allocation (object), pause_recommendations (array), expansion_opportunities (array).`;
        break;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.0,
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI analysis', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    // Calculate confidence score based on data availability
    const confidenceScore = Math.min(
      0.5 + 
      (applicationsData.length > 0 ? 0.2 : 0) +
      (jobGroupsData.length > 0 ? 0.2 : 0) +
      (jobListingIds.length > 0 ? 0.1 : 0),
      1.0
    );

    // Store analysis in database (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: insertError } = await supabase
      .from('campaign_ai_analysis')
      .insert({
        campaign_id: campaignId,
        organization_id: campaign.organization_id,
        analysis_type: analysisType,
        ai_provider: 'openai',
        insights: aiResponse.insights || aiResponse,
        recommendations: aiResponse.recommendations || [],
        metrics: aiResponse.metrics || {},
        confidence_score: confidenceScore,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store analysis:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...aiResponse,
          confidence_score: confidenceScore,
          analysis_type: analysisType,
          generated_at: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Campaign AI optimizer error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});