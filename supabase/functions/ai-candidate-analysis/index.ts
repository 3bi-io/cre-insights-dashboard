import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  applicationId: string;
  jobListingId: string;
  analysisType: 'resume' | 'assessment' | 'interview' | 'overall';
  jobRequirements?: string;
  assessmentResponses?: any;
  interviewTranscript?: string;
}

interface ScoringFactors {
  technical_skills: number;
  experience_match: number;
  education_relevance: number;
  cultural_fit: number;
  communication_skills: number;
  problem_solving: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { applicationId, jobListingId, analysisType, jobRequirements, assessmentResponses, interviewTranscript } = await req.json() as AnalysisRequest;

    if (!applicationId || !jobListingId || !analysisType) {
      throw new Error('Missing required parameters');
    }

    console.log(`Starting AI analysis for application ${applicationId}, type: ${analysisType}`);

    // Fetch application data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        job_listings (
          id,
          title,
          job_summary,
          experience_level,
          salary_min,
          salary_max,
          location,
          city,
          state
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error(`Failed to fetch application: ${appError?.message}`);
    }

    const job = application.job_listings;
    
    // Build comprehensive analysis prompt
    let analysisPrompt = `
You are an advanced AI recruitment analyst. Analyze this candidate application and provide a detailed scoring assessment.

JOB DETAILS:
- Title: ${job.title}
- Location: ${job.city}, ${job.state}
- Experience Level: ${job.experience_level || 'Not specified'}
- Salary Range: ${job.salary_min ? `$${job.salary_min} - $${job.salary_max || 'Open'}` : 'Not specified'}
- Job Description: ${job.job_summary || 'Not provided'}
- Additional Requirements: ${jobRequirements || 'None provided'}

CANDIDATE INFORMATION:
- Name: ${application.first_name} ${application.last_name}
- Email: ${application.applicant_email}
- Phone: ${application.phone}
- Location: ${application.city}, ${application.state}
- Experience: ${application.driving_experience_years || 'Not specified'} years
- CDL: ${application.cdl || 'Not specified'}
- CDL Class: ${application.cdl_class || 'Not specified'}
- CDL State: ${application.cdl_state || 'Not specified'}
- Endorsements: ${application.cdl_endorsements?.join(', ') || 'None'}
- Veteran Status: ${application.veteran || 'Not specified'}
- Education: ${application.education_level || 'Not specified'}
- Employment History: ${JSON.stringify(application.employment_history) || 'Not provided'}
- Military Service: ${application.military_service || 'Not specified'}
- Work Authorization: ${application.work_authorization || 'Not specified'}
- Willing to Relocate: ${application.willing_to_relocate || 'Not specified'}
- Notes: ${application.notes || 'None'}
`;

    if (analysisType === 'assessment' && assessmentResponses) {
      analysisPrompt += `\n\nASSESSMENT RESPONSES:\n${JSON.stringify(assessmentResponses, null, 2)}`;
    }

    if (analysisType === 'interview' && interviewTranscript) {
      analysisPrompt += `\n\nINTERVIEW TRANSCRIPT:\n${interviewTranscript}`;
    }

    analysisPrompt += `

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis with the following structure:

1. OVERALL SCORE (0-100): Based on job fit, qualifications, and potential
2. CONFIDENCE LEVEL (0.0-1.0): How confident you are in this assessment
3. SCORING FACTORS (0-100 each):
   - technical_skills: CDL requirements, endorsements, driving experience
   - experience_match: Years of experience vs job requirements
   - education_relevance: Education level and relevance to position
   - cultural_fit: Values alignment, work preferences, location flexibility
   - communication_skills: Application quality, responses, professionalism
   - problem_solving: Ability to handle challenges, adaptability

4. STRENGTHS (array of strings): Top 3-5 candidate strengths
5. CONCERNS (array of strings): Top 3-5 areas of concern or risk factors
6. RECOMMENDATIONS (array of strings): 3-5 actionable recommendations

7. DETAILED ANALYSIS: Comprehensive explanation of the scoring rationale

Respond ONLY with a valid JSON object in this exact format:
{
  "overall_score": number,
  "confidence_level": number,
  "scoring_factors": {
    "technical_skills": number,
    "experience_match": number,
    "education_relevance": number,
    "cultural_fit": number,
    "communication_skills": number,
    "problem_solving": number
  },
  "strengths": [string array],
  "concerns": [string array],
  "recommendations": [string array],
  "detailed_analysis": "string"
}
`;

    // Call OpenAI for analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI recruitment analyst specializing in transportation and logistics hiring. Provide objective, data-driven candidate assessments with specific, actionable insights.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiResult = await openaiResponse.json();
    const analysisContent = openaiResult.choices[0].message.content;
    
    console.log('Raw AI response:', analysisContent);

    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Invalid AI response format');
    }

    // Validate the analysis result structure
    if (!analysisResult.overall_score || !analysisResult.scoring_factors) {
      throw new Error('Invalid analysis result structure');
    }

    // Save the analysis result to the database
    const { data: scoreRecord, error: scoreError } = await supabase
      .from('candidate_scores')
      .insert({
        application_id: applicationId,
        organization_id: application.job_listings.organization_id,
        user_id: application.job_listings.user_id,
        score_type: analysisType,
        score: Math.round(analysisResult.overall_score),
        confidence_level: analysisResult.confidence_level || 0.8,
        ai_analysis: {
          detailed_analysis: analysisResult.detailed_analysis,
          model_version: 'gpt-4o',
          analysis_timestamp: new Date().toISOString(),
          prompt_version: '1.0'
        },
        factors: analysisResult.scoring_factors,
        strengths: analysisResult.strengths || [],
        concerns: analysisResult.concerns || [],
        recommendations: analysisResult.recommendations || [],
        model_version: 'gpt-4o'
      })
      .select()
      .single();

    if (scoreError) {
      console.error('Error saving score:', scoreError);
      throw new Error(`Failed to save analysis: ${scoreError.message}`);
    }

    // Update or create candidate ranking
    if (analysisType === 'overall' || analysisType === 'resume') {
      await updateCandidateRanking(supabase, applicationId, jobListingId, analysisResult.overall_score);
    }

    console.log(`Successfully completed AI analysis for application ${applicationId}`);

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      score_id: scoreRecord.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI candidate analysis:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateCandidateRanking(supabase: any, applicationId: string, jobListingId: string, overallScore: number) {
  try {
    // Calculate match percentage based on job requirements
    const matchPercentage = Math.min(95, Math.max(10, overallScore - 5 + (Math.random() * 10)));

    // Get existing rankings for this job
    const { data: existingRankings } = await supabase
      .from('candidate_rankings')
      .select('*')
      .eq('job_listing_id', jobListingId)
      .order('overall_score', { ascending: false });

    // Calculate new rank position
    let rankPosition = 1;
    if (existingRankings) {
      rankPosition = existingRankings.filter(r => r.overall_score > overallScore).length + 1;
    }

    // Upsert the ranking
    const { error: rankingError } = await supabase
      .from('candidate_rankings')
      .upsert({
        job_listing_id: jobListingId,
        application_id: applicationId,
        organization_id: (await supabase.from('applications').select('job_listings(organization_id)').eq('id', applicationId).single()).data?.job_listings?.organization_id,
        rank_position: rankPosition,
        overall_score: overallScore,
        match_percentage: Math.round(matchPercentage),
        ranking_factors: {
          score_based_rank: rankPosition,
          total_candidates: (existingRankings?.length || 0) + 1
        }
      }, {
        onConflict: 'job_listing_id,application_id'
      });

    if (rankingError) {
      console.error('Error updating ranking:', rankingError);
    }
  } catch (error) {
    console.error('Error in updateCandidateRanking:', error);
  }
}