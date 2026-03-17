import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors-config.ts";
import { createLogger } from "../_shared/logger.ts";
import { getServiceClient } from "../_shared/supabase-client.ts";

const logger = createLogger('generate-og-images');

const OG_IMAGES = [
  {
    key: "features",
    filename: "og-features",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for an AI recruitment features page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "AI-Powered Recruitment Features" below it in lighter blue-white text. On the right side, show a stylized dashboard grid icon with 6 glowing blue rectangles arranged in a 2x3 grid, representing feature modules. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "jobs",
    filename: "og-jobs",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a job listings page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Browse Open Positions" below it in lighter blue-white text. On the right side, show a stylized briefcase icon with glowing blue accents and small floating job listing cards around it. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "clients",
    filename: "og-clients",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a clients showcase page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Trusted by Leading Companies" below it in lighter blue-white text. On the right side, show a stylized modern building/skyscraper icon with glowing blue windows and a handshake symbol below it. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "contact",
    filename: "og-contact",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a contact page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Get in Touch" below it in lighter blue-white text. On the right side, show a stylized envelope icon with a glowing blue chat bubble overlay and subtle signal waves radiating outward. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "resources",
    filename: "og-resources",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a resources and guides page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Guides, Tools & Insights" below it in lighter blue-white text. On the right side, show a stylized open book icon with glowing blue pages and a lightbulb above it with teal accent light. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "demo",
    filename: "og-demo",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a product demo page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "See Apply AI in Action" below it in lighter blue-white text. On the right side, show a stylized laptop/screen with a glowing blue play button in the center and subtle UI chrome elements. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "map",
    filename: "og-map",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a job map page showing jobs near you. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Jobs Near You" below it in lighter blue-white text. On the right side, show a stylized globe/map icon with glowing blue location pin markers at various points and subtle latitude/longitude grid lines. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "privacy",
    filename: "og-privacy",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a privacy policy page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Your Privacy Matters" below it in lighter blue-white text. On the right side, show a stylized shield icon with a glowing blue lock symbol in the center and subtle checkmark accents around it. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "terms",
    filename: "og-terms",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a terms of service page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Terms of Service" below it in lighter blue-white text. On the right side, show a stylized document/scroll icon with glowing blue ruled lines and a small gavel or seal stamp icon with teal accent. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
  {
    key: "sitemap",
    filename: "og-sitemap",
    prompt: `Create a professional 1200x630 Open Graph social sharing image for a sitemap/navigation page. Use a dark navy-to-blue gradient background (#0f172a to #1e40af). On the left side, prominently display the text "Apply AI" in large white bold sans-serif font, with "Site Navigation" below it in lighter blue-white text. On the right side, show a stylized hierarchical sitemap tree icon with glowing blue nodes connected by lines, representing page structure. Add subtle geometric dot-grid patterns and faint diagonal lines across the background. Include a small three-bar equalizer logo icon in a rounded blue rectangle in the top-left. Clean, modern SaaS branding. No photographs of people.`,
  },
];

serve(async (req) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, { success: boolean; url?: string; error?: string }> = {};

    for (const image of OG_IMAGES) {
      logger.info(`Generating OG image: ${image.key}`);
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: image.prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI API failed [${aiResponse.status}]: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageDataUrl) throw new Error("No image returned from AI model");

        const base64Match = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) throw new Error("Invalid image data format");

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const filePath = `${image.filename}.${imageFormat}`;

        const { error: uploadError } = await supabase.storage
          .from("page-assets")
          .upload(filePath, binaryData, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from("page-assets")
          .getPublicUrl(filePath);

        results[image.key] = { success: true, url: publicUrlData.publicUrl };
        logger.info(`OG image generated: ${image.key}`, { url: publicUrlData.publicUrl });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`OG image failed: ${image.key}`, err);
        results[image.key] = { success: false, error: msg };
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('OG image generation error', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
