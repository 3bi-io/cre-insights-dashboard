import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  jobType: string;
  benefits: string[];
  companyName?: string;
  location?: string;
  salaryRange?: string;
  customPrompt?: string;
  generateImage?: boolean;
  aspectRatio?: string;
}

interface GeneratedContent {
  headline: string;
  body: string;
  hashtags: string[];
  callToAction?: string;
}

const BENEFIT_LABELS: Record<string, string> = {
  sign_on_bonus: "$5k Sign-on Bonus",
  home_weekly: "Home Weekly",
  new_equipment: "New Equipment",
  full_benefits: "Full Benefits",
  pet_friendly: "Pet Friendly",
  no_touch_freight: "No Touch Freight",
  paid_orientation: "Paid Orientation",
  safety_bonuses: "Safety Bonuses",
  rider_policy: "Rider Policy",
  direct_deposit: "Direct Deposit",
  referral_bonus: "Referral Bonus",
  health_insurance: "Health Insurance",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  long_haul: "Long Haul",
  regional: "Regional",
  local: "Local",
  dedicated: "Dedicated",
  team: "Team Driving",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: GenerateRequest = await req.json();
    const { jobType, benefits, companyName, location, salaryRange, customPrompt } = body;

    // Build the prompt for AI
    const benefitsList = benefits
      .map((b) => BENEFIT_LABELS[b] || b)
      .join(", ");

    const jobTypeLabel = JOB_TYPE_LABELS[jobType] || jobType;

    const systemPrompt = `You are an expert recruitment marketing copywriter specializing in truck driver job advertisements. You create compelling, concise social media ad copy that drives applications.

Your ad copy must:
- Be attention-grabbing and action-oriented
- Highlight the most attractive benefits
- Use industry-relevant language
- Be authentic and trustworthy
- Include a clear call to action
- Be optimized for social media engagement

Format your response as JSON with exactly these fields:
{
  "headline": "A compelling headline under 60 characters",
  "body": "The main ad copy, 150-280 characters for social media",
  "hashtags": ["relevant", "hashtags", "without-hash-symbol"],
  "callToAction": "Apply Now" or similar CTA
}`;

    const userPrompt = `Create a social media job ad for a ${jobTypeLabel} CDL truck driver position.

${companyName ? `Company: ${companyName}` : ""}
${location ? `Location: ${location}` : ""}
${salaryRange ? `Salary: ${salaryRange}` : ""}
${benefitsList ? `Key Benefits: ${benefitsList}` : ""}
${customPrompt ? `Additional instructions: ${customPrompt}` : ""}

Generate engaging ad copy that will attract qualified CDL drivers. Return ONLY valid JSON.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response
    let generatedContent: GeneratedContent;
    try {
      // Extract JSON from the response (in case of markdown formatting)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      generatedContent = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Fallback content
      generatedContent = {
        headline: `Now Hiring: ${jobTypeLabel} CDL Drivers`,
        body: `Join our team! We're looking for experienced ${jobTypeLabel.toLowerCase()} drivers. ${benefitsList ? `Enjoy ${benefitsList}.` : ""} Apply today!`,
        hashtags: ["CDLJobs", "TruckDriver", "Hiring", "CDLDrivers"],
        callToAction: "Apply Now",
      };
    }

    // Validate and clean hashtags
    generatedContent.hashtags = (generatedContent.hashtags || [])
      .map((tag: string) => tag.replace(/^#/, "").trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        mediaUrl: null, // Image generation would be a separate step
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate ad creative error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate ad creative",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
