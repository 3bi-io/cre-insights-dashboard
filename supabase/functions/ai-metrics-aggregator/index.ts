import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIMetrics {
  totalInteractions: number;
  avgResponseTime: number;
  satisfactionRate: number;
  automationSavings: number;
  timeToHireComparison: {
    aiAvg: number;
    traditionalAvg: number;
    improvement: number;
  };
  qualityScoreComparison: {
    aiAvg: number;
    traditionalAvg: number;
    improvement: number;
  };
  automationBreakdown: {
    screening: number;
    initialContact: number;
    faqResolution: number;
  };
  performanceImprovements: {
    responseTime: number;
    applicationProcessing: number;
    candidateEngagement: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;

    // Parse query parameters
    const url = new URL(req.url);
    const daysBack = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get AI interaction statistics
    const { data: interactions, error: interactionsError } = await supabase
      .from('ai_interaction_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('organization_id', organizationId);

    if (interactionsError) throw interactionsError;

    // Get AI decision tracking data
    const { data: decisions, error: decisionsError } = await supabase
      .from('ai_decision_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('organization_id', organizationId);

    if (decisionsError) throw decisionsError;

    // Get candidate scores for quality metrics
    const { data: scores, error: scoresError } = await supabase
      .from('candidate_scores')
      .select('score, score_type, created_at, application_id')
      .gte('created_at', startDate.toISOString())
      .eq('organization_id', organizationId);

    if (scoresError) throw scoresError;

    // Calculate metrics
    const totalInteractions = interactions?.length || 0;
    
    const successfulInteractions = interactions?.filter(i => i.success) || [];
    const avgResponseTime = successfulInteractions.length > 0
      ? successfulInteractions.reduce((sum, i) => sum + (i.response_time_ms || 0), 0) / successfulInteractions.length / 1000
      : 0;

    // Calculate satisfaction rate (successful interactions / total)
    const satisfactionRate = totalInteractions > 0
      ? (successfulInteractions.length / totalInteractions) * 100
      : 0;

    // Separate AI vs traditional decisions
    const aiDecisions = decisions?.filter(d => d.used_ai) || [];
    const traditionalDecisions = decisions?.filter(d => !d.used_ai) || [];

    // Calculate time to hire
    const aiTimeToHire = aiDecisions.length > 0
      ? aiDecisions.reduce((sum, d) => sum + (d.time_to_decision_minutes || 0), 0) / aiDecisions.length / 60
      : 0;

    const traditionalTimeToHire = traditionalDecisions.length > 0
      ? traditionalDecisions.reduce((sum, d) => sum + (d.time_to_decision_minutes || 0), 0) / traditionalDecisions.length / 60
      : 0;

    const timeToHireImprovement = traditionalTimeToHire > 0
      ? ((traditionalTimeToHire - aiTimeToHire) / traditionalTimeToHire) * 100
      : 0;

    // Calculate quality scores
    const aiQualityScores = aiDecisions
      .map(d => d.quality_score)
      .filter(s => s !== null && s !== undefined) as number[];
    
    const traditionalQualityScores = traditionalDecisions
      .map(d => d.quality_score)
      .filter(s => s !== null && s !== undefined) as number[];

    const aiAvgQuality = aiQualityScores.length > 0
      ? aiQualityScores.reduce((sum, s) => sum + s, 0) / aiQualityScores.length
      : 0;

    const traditionalAvgQuality = traditionalQualityScores.length > 0
      ? traditionalQualityScores.reduce((sum, s) => sum + s, 0) / traditionalQualityScores.length
      : 0;

    const qualityImprovement = traditionalAvgQuality > 0
      ? ((aiAvgQuality - traditionalAvgQuality) / traditionalAvgQuality) * 100
      : 0;

    // Calculate automation breakdown
    const screeningInteractions = interactions?.filter(i => i.interaction_type === 'application_screening') || [];
    const scoringInteractions = interactions?.filter(i => i.interaction_type === 'candidate_scoring') || [];
    const chatInteractions = interactions?.filter(i => i.interaction_type === 'chat_interaction') || [];

    const screeningAutomation = screeningInteractions.length > 0
      ? (screeningInteractions.filter(i => i.success).length / screeningInteractions.length) * 100
      : 0;

    const scoringAutomation = scoringInteractions.length > 0
      ? (scoringInteractions.filter(i => i.success).length / scoringInteractions.length) * 100
      : 0;

    const chatAutomation = chatInteractions.length > 0
      ? (chatInteractions.filter(i => i.success).length / chatInteractions.length) * 100
      : 0;

    // Estimate cost savings (based on time saved * average hourly rate)
    const avgHourlyRate = 50; // $50/hour baseline for recruiter time
    const hoursSaved = (traditionalTimeToHire - aiTimeToHire) * aiDecisions.length;
    const automationSavings = Math.max(0, hoursSaved * avgHourlyRate);

    // Calculate performance improvements
    const baselineResponseTime = 24; // 24 hours baseline
    const responseTimeImprovement = ((baselineResponseTime - aiTimeToHire) / baselineResponseTime) * 100;

    const baselineProcessingTime = 48; // 48 hours baseline
    const processingImprovement = aiTimeToHire > 0
      ? ((baselineProcessingTime - aiTimeToHire) / baselineProcessingTime) * 100
      : 0;

    // Calculate engagement improvement from interaction success rate
    const engagementImprovement = satisfactionRate * 0.45; // Scale to ~45% max

    const metrics: AIMetrics = {
      totalInteractions,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      satisfactionRate: Math.round(satisfactionRate),
      automationSavings: Math.round(automationSavings),
      timeToHireComparison: {
        aiAvg: Math.round(aiTimeToHire * 10) / 10,
        traditionalAvg: Math.round(traditionalTimeToHire * 10) / 10,
        improvement: Math.round(timeToHireImprovement),
      },
      qualityScoreComparison: {
        aiAvg: Math.round(aiAvgQuality * 10) / 10,
        traditionalAvg: Math.round(traditionalAvgQuality * 10) / 10,
        improvement: Math.round(qualityImprovement),
      },
      automationBreakdown: {
        screening: Math.round(screeningAutomation),
        initialContact: Math.round(scoringAutomation),
        faqResolution: Math.round(chatAutomation),
      },
      performanceImprovements: {
        responseTime: Math.max(0, Math.min(100, Math.round(responseTimeImprovement))),
        applicationProcessing: Math.max(0, Math.min(100, Math.round(processingImprovement))),
        candidateEngagement: Math.max(0, Math.min(100, Math.round(engagementImprovement))),
      },
    };

    return new Response(
      JSON.stringify({ success: true, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error aggregating AI metrics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
