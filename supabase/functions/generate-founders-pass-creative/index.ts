import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('generate-founders-pass-creative');

const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-3-pro-image-preview";

const IMAGE_PROMPT = `Create a cinematic, ultra-professional recruitment marketing image in 16:9 landscape format. Feature a modern semi-truck (Peterbilt or Kenworth style) on an expansive American highway at golden hour with dramatic sky lighting. The truck should be pristine, showing chrome details and professional fleet branding. Include subtle visual elements suggesting technology and innovation -- a faint digital overlay or holographic accent on the truck's cab suggesting AI-powered recruitment. The scene should convey opportunity, freedom, and professional excellence. Warm golden tones with deep blue sky contrast. No text, no words, no letters anywhere in the image. Photorealistic quality, cinematic composition with rule-of-thirds framing. Ultra high resolution.`;

const AD_COPY_PROMPT = `You are an expert recruitment marketing copywriter. Write a social media ad for the "Founders Pass" — a limited-time, performance-based pricing model for trucking companies to recruit CDL drivers.

Key value props:
- Only $3 per application ($1 intake + $1 ATS delivery + $1 optional AI Voice follow-up)
- Zero upfront cost — completely pay-per-performance
- AI-powered intake and screening
- Instant ATS delivery to any connected system
- Limited to founding partners only

Write compelling copy that creates urgency and highlights the revolutionary pricing model. Target: fleet managers, recruiting directors, and trucking company owners.`;

const AD_CREATIVE_TOOL = {
  type: "function" as const,
  function: {
    name: "format_ad_creative",
    description: "Format the generated ad creative content into structured fields.",
    parameters: {
      type: "object",
      properties: {
        headline: { type: "string", description: "A compelling headline under 60 characters about Founders Pass" },
        body: { type: "string", description: "The main ad copy, 150-280 characters highlighting $3/apply and zero upfront cost" },
        hashtags: {
          type: "array",
          items: { type: "string" },
          description: "5 relevant hashtags without the hash symbol",
        },
        callToAction: { type: "string", description: "A short call to action" },
      },
      required: ["headline", "body", "hashtags", "callToAction"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = getServiceClient();

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let organizationId: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();
        organizationId = profile?.organization_id || null;
      }
    }

    logger.info("Starting Founders Pass creative generation");

    const [imageResponse, textResponse] = await Promise.all([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: IMAGE_PROMPT }],
          modalities: ["image", "text"],
        }),
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [
            { role: "system", content: "You are an expert recruitment marketing copywriter." },
            { role: "user", content: AD_COPY_PROMPT },
          ],
          tools: [AD_CREATIVE_TOOL],
          tool_choice: { type: "function", function: { name: "format_ad_creative" } },
        }),
      }),
    ]);

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      throw new Error(`Image generation failed [${imageResponse.status}]: ${errText}`);
    }

    const imageData = await imageResponse.json();
    const imageDataUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageDataUrl) throw new Error("No image returned from AI model");

    const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const filename = `founders-pass-creative-${Date.now()}.${imageFormat}`;
    const { error: uploadError } = await supabase.storage
      .from("page-assets")
      .upload(filename, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("page-assets")
      .getPublicUrl(filename);

    const mediaUrl = publicUrlData.publicUrl;
    logger.info("Image uploaded", { mediaUrl });

    let adCopy = {
      headline: "Recruit CDL Drivers for Just $3/Apply",
      body: "Founders Pass: Zero upfront cost, AI-powered intake, instant ATS delivery. Only $3 per qualified application. Limited spots for founding partners.",
      hashtags: ["CDLJobs", "TruckDrivers", "Hiring", "FoundersPass", "NowHiring"],
      callToAction: "Apply Now",
    };

    if (textResponse.ok) {
      const textData = await textResponse.json();
      try {
        const toolCall = textData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          adCopy = JSON.parse(toolCall.function.arguments);
        }
      } catch (e: unknown) {
        logger.error("Failed to parse ad copy, using fallback", e);
      }
    }

    adCopy.hashtags = (adCopy.hashtags || [])
      .map((tag: string) => tag.replace(/^#/, "").trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 5);

    const { data: creative, error: insertError } = await supabase
      .from("generated_ad_creatives")
      .insert({
        headline: adCopy.headline,
        body: adCopy.body,
        hashtags: adCopy.hashtags,
        job_type: "founders_pass",
        benefits: ["zero_upfront", "pay_per_apply", "ai_screening", "ats_delivery", "voice_followup"],
        media_url: mediaUrl,
        media_type: "image",
        aspect_ratio: "16:9",
        status: "active",
        created_by: userId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Failed to save creative", insertError);
      throw new Error(`Failed to save creative: ${insertError.message}`);
    }

    logger.info("Founders Pass creative saved", { creativeId: creative.id });

    return new Response(
      JSON.stringify({
        success: true,
        creative: {
          id: creative.id,
          headline: adCopy.headline,
          body: adCopy.body,
          hashtags: adCopy.hashtags,
          callToAction: adCopy.callToAction,
          mediaUrl,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Founders Pass creative generation error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: message || "Failed to generate creative",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
