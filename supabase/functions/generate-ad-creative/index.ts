import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { getCorsHeaders } from '../_shared/cors-config.ts';

const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-3-pro-image-preview";

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

const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:5": { width: 896, height: 1120 },
};

// Tool definition for structured output extraction
const AD_CREATIVE_TOOL = {
  type: "function" as const,
  function: {
    name: "format_ad_creative",
    description: "Format the generated ad creative content into structured fields.",
    parameters: {
      type: "object",
      properties: {
        headline: { type: "string", description: "A compelling headline under 60 characters" },
        body: { type: "string", description: "The main ad copy, 150-280 characters for social media" },
        hashtags: { 
          type: "array", 
          items: { type: "string" },
          description: "3-5 relevant hashtags without the hash symbol" 
        },
        callToAction: { type: "string", description: "A short call to action like 'Apply Now'" },
      },
      required: ["headline", "body", "hashtags", "callToAction"],
      additionalProperties: false,
    },
  },
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
    const { jobType, benefits, companyName, location, salaryRange, customPrompt, generateImage, aspectRatio } = body;

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
- Be optimized for social media engagement`;

    const userPrompt = `Create a social media job ad for a ${jobTypeLabel} CDL truck driver position.

${companyName ? `Company: ${companyName}` : ""}
${location ? `Location: ${location}` : ""}
${salaryRange ? `Salary: ${salaryRange}` : ""}
${benefitsList ? `Key Benefits: ${benefitsList}` : ""}
${customPrompt ? `Additional instructions: ${customPrompt}` : ""}

Generate engaging ad copy that will attract qualified CDL drivers.`;

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [AD_CREATIVE_TOOL],
        tool_choice: { type: "function", function: { name: "format_ad_creative" } },
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
    
    // Extract structured content from tool call response
    let generatedContent;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        generatedContent = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing from content if tool calling wasn't used
        const aiContent = aiData.choices?.[0]?.message?.content;
        if (aiContent) {
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedContent = JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    if (!generatedContent) {
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

    // Generate image if requested
    let mediaUrl: string | null = null;
    let imageError: string | null = null;
    
    if (generateImage) {
      try {
        const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio || "16:9"] || ASPECT_RATIO_DIMENSIONS["16:9"];
        
        const imagePrompt = `Create a professional recruitment advertisement image for a ${jobTypeLabel} truck driver position.

Design requirements:
- ${aspectRatio || "16:9"} aspect ratio (${dimensions.width}x${dimensions.height} pixels)
- Professional, modern recruitment marketing style
- Feature a semi-truck or trucking/transportation imagery
- Clean, eye-catching design suitable for social media
- High contrast colors for visibility
- Professional and corporate appropriate
- Do NOT include any text, words, or letters in the image (text will be overlaid separately)
- Focus on imagery only: trucks, roads, landscapes, logistics

Visual elements to incorporate:
${benefitsList ? `- Visual metaphors for: ${benefitsList}` : "- General trucking industry imagery"}
${location ? `- Scenic elements suggesting: ${location}` : "- American highway scenery"}

Style: High-quality stock photo style for ${companyName || "a professional trucking company"}'s social media recruitment campaign.`;

        console.log("Generating image with model:", IMAGE_MODEL);

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: IMAGE_MODEL,
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (generatedImageUrl) {
            console.log("Image generated successfully with", IMAGE_MODEL);
            mediaUrl = generatedImageUrl;
          } else {
            console.log("No image URL in response:", JSON.stringify(imageData).substring(0, 500));
            imageError = "Image generation returned no image. Try again.";
          }
        } else {
          const errText = await imageResponse.text();
          console.error("Image generation failed:", imageResponse.status, errText);
          
          if (imageResponse.status === 429) {
            imageError = "Image generation rate limited. Try again in a moment.";
          } else if (imageResponse.status === 402) {
            imageError = "AI credits exhausted for image generation. Please add credits.";
          } else {
            imageError = "Image generation failed. Text content was generated successfully.";
          }
        }
      } catch (imgErr) {
        console.error("Image generation error:", imgErr);
        imageError = "Image generation encountered an error. Text content was generated successfully.";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        mediaUrl,
        imageError,
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