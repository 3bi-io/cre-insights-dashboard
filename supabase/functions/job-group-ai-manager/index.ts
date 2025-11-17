import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface JobGroupAIRequest {
  organizationId?: string;
  campaignId?: string;
  analysisType: 'suggest_groups' | 'optimize_existing' | 'publisher_recommendation' | 'performance_analysis';
  jobListingIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, campaignId, analysisType, jobListingIds }: JobGroupAIRequest = await req.json();

    if (!analysisType) {
      return new Response(
        JSON.stringify({ error: 'analysisType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job listings data
    let query = supabase
      .from('job_listings')
      .select('id, title, location, description, requirements, salary_min, salary_max, job_type, status');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (jobListingIds && jobListingIds.length > 0) {
      query = query.in('id', jobListingIds);
    }

    if (campaignId) {
      // Get jobs assigned to this campaign
      const { data: assignments } = await supabase
        .from('campaign_job_assignments')
        .select('job_listing_id')
        .eq('campaign_id', campaignId);
      
      if (assignments && assignments.length > 0) {
        const assignedJobIds = assignments.map(a => a.job_listing_id);
        query = query.in('id', assignedJobIds);
      }
    }

    query = query.eq('status', 'active').limit(100);

    const { data: jobListings, error: jobsError } = await query;

    if (jobsError) {
      console.error('Failed to fetch job listings:', jobsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch job listings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!jobListings || jobListings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No job listings found', suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing job groups for context
    let existingGroups = [];
    if (campaignId) {
      const { data: groups } = await supabase
        .from('job_groups')
        .select('id, name, publisher, created_at')
        .eq('campaign_id', campaignId);
      existingGroups = groups || [];
    }

    // Build AI context
    const context = {
      jobListings: jobListings.map(job => ({
        id: job.id,
        title: job.title,
        location: job.location,
        job_type: job.job_type,
        salary_range: job.salary_min && job.salary_max 
          ? `$${job.salary_min} - $${job.salary_max}` 
          : 'Not specified',
        requirements_summary: typeof job.requirements === 'string' 
          ? job.requirements.substring(0, 200) 
          : 'Not specified',
      })),
      existingGroups: existingGroups.map(g => ({
        name: g.name,
        publisher: g.publisher,
      })),
      totalJobs: jobListings.length,
    };

    // Create AI prompt based on analysis type
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'suggest_groups':
        systemPrompt = 'You are an expert job advertising strategist. Analyze job listings and suggest optimal job groups for advertising campaigns. Group similar jobs together for better targeting and cost efficiency.';
        userPrompt = `Analyze these ${context.totalJobs} job listings and suggest optimal job groups:\n\nJobs: ${JSON.stringify(context.jobListings, null, 2)}\n\nExisting Groups: ${JSON.stringify(context.existingGroups, null, 2)}\n\nProvide:\n1. Suggested job groups (3-7 groups max)\n2. For each group: name, description, recommended_publisher (choose from: Indeed, Indeed Premium, Facebook, Google Jobs, LinkedIn, Craigslist), job_ids (array of job IDs that should be in this group)\n3. Reasoning for each grouping\n4. Expected performance benefits\n\nReturn response as JSON with key: groups (array of objects with: name, description, recommended_publisher, job_ids (array), reasoning, benefits).`;
        break;

      case 'optimize_existing':
        systemPrompt = 'You are an expert job group optimization specialist. Analyze existing job groups and suggest improvements.';
        userPrompt = `Review current job groups and suggest optimizations:\n\nJobs: ${JSON.stringify(context.jobListings, null, 2)}\n\nCurrent Groups: ${JSON.stringify(context.existingGroups, null, 2)}\n\nProvide:\n1. Which groups to merge or split\n2. Jobs to reassign to different groups\n3. Publisher changes to consider\n4. Expected performance improvements\n\nReturn response as JSON with keys: merge_suggestions (array), split_suggestions (array), reassignments (array of {job_id, from_group, to_group, reason}), publisher_changes (array).`;
        break;

      case 'publisher_recommendation':
        systemPrompt = 'You are an expert in multi-platform job advertising. Recommend the best publishers for each job group based on job characteristics, location, and industry best practices.';
        userPrompt = `Recommend publishers for these jobs:\n\nJobs: ${JSON.stringify(context.jobListings, null, 2)}\n\nAvailable Publishers: Indeed, Indeed Premium, Facebook, Google Jobs, LinkedIn, Craigslist, ZipRecruiter, CareerBuilder\n\nFor each job or job group, recommend:\n1. Primary publisher (best fit)\n2. Secondary publishers (good alternatives)\n3. Publishers to avoid\n4. Reasoning for each recommendation\n5. Expected performance metrics\n\nReturn response as JSON with key: recommendations (array of objects with: job_ids (array), primary_publisher, secondary_publishers (array), avoid_publishers (array), reasoning, expected_metrics).`;
        break;

      case 'performance_analysis':
        systemPrompt = 'You are a job advertising performance analyst. Analyze job characteristics and predict performance across different publishers.';
        userPrompt = `Analyze performance potential for these jobs:\n\nJobs: ${JSON.stringify(context.jobListings, null, 2)}\n\nProvide:\n1. High-potential jobs (likely to perform well)\n2. Jobs needing optimization\n3. Publisher-specific insights\n4. Budget allocation recommendations\n\nReturn response as JSON with keys: high_potential (array of job_ids with reasoning), needs_optimization (array), publisher_insights (object), budget_recommendations (object).`;
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
        max_completion_tokens: 3000,
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

    // Calculate confidence score
    const confidenceScore = Math.min(
      0.6 + 
      (jobListings.length >= 10 ? 0.2 : jobListings.length * 0.02) +
      (existingGroups.length > 0 ? 0.2 : 0),
      1.0
    );

    // Store suggestions in database if it's a suggest_groups analysis
    if (analysisType === 'suggest_groups' && campaignId) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // Expires in 48 hours

      const { error: insertError } = await supabase
        .from('job_group_suggestions')
        .insert({
          organization_id: organizationId,
          campaign_id: campaignId,
          suggested_groups: aiResponse.groups || aiResponse,
          reasoning: { analysis_type: analysisType, context: 'AI-generated suggestions' },
          confidence_score: confidenceScore,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          ai_provider: 'openai',
        });

      if (insertError) {
        console.error('Failed to store suggestions:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...aiResponse,
          confidence_score: confidenceScore,
          analysis_type: analysisType,
          jobs_analyzed: jobListings.length,
          generated_at: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Job group AI manager error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});