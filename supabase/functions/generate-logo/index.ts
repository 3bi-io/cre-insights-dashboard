import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { type } = await req.json();

    let prompt = '';
    
    if (type === 'icon') {
      prompt = `Create a professional, modern logo icon for "ATS.me" - an AI-powered voice recruitment platform. 

Design requirements:
- Clean, minimal square icon design (no text)
- Represents AI voice technology and recruitment
- Incorporate subtle soundwave or voice element with neural network/AI nodes
- Use vibrant blue (#3b82f6) as primary color with emerald green (#10b981) accent
- Modern, tech-forward, trustworthy aesthetic
- Must be recognizable at small sizes (32px favicon)
- Solid white or transparent background
- No gradients, flat design style
- Professional and corporate appropriate

Style: Minimalist tech logo, similar to modern SaaS company icons. Think Slack, Notion, or Linear logo simplicity.`;
    } else if (type === 'horizontal') {
      prompt = `Create a professional horizontal logo for "ATS.me" - an AI-powered voice recruitment platform.

Design requirements:
- Icon on the left side + "ATS.me" text on the right
- The icon should represent AI voice technology (soundwave + neural nodes)
- Text "ATS.me" in clean, modern sans-serif font (like Inter or SF Pro)
- Use vibrant blue (#3b82f6) as primary color with emerald green (#10b981) accent
- Dark text version for light backgrounds
- Modern, tech-forward, trustworthy aesthetic
- Correct spelling: "ATS.me" with the period before "me"
- 16:9 aspect ratio suitable for website headers
- Solid white background
- Professional and corporate appropriate

Style: Modern SaaS logo lockup. Clean typography, balanced spacing.`;
    } else if (type === 'horizontal-white') {
      prompt = `Create a professional horizontal logo for "ATS.me" - an AI-powered voice recruitment platform.

Design requirements:
- Icon on the left side + "ATS.me" text on the right
- The icon should represent AI voice technology (soundwave + neural nodes)
- Text "ATS.me" in clean, modern sans-serif font (like Inter or SF Pro)
- WHITE/light colored icon and text for dark backgrounds
- Use vibrant blue (#3b82f6) and emerald green (#10b981) accents in the icon
- Modern, tech-forward, trustworthy aesthetic
- Correct spelling: "ATS.me" with the period before "me"
- 16:9 aspect ratio suitable for website headers
- Transparent or dark background (#1a1a2e)
- Professional and corporate appropriate

Style: Modern SaaS logo lockup for dark mode. Clean white typography, balanced spacing.`;
    } else if (type === 'og-image') {
      prompt = `Create a professional social media preview image (Open Graph) for "ATS.me" - an AI-powered voice recruitment platform.

Design requirements:
- 1200x630 pixels aspect ratio
- Feature the ATS.me logo prominently in the center-left
- Tagline: "AI-Powered Voice Recruitment"
- Modern, gradient background with vibrant blue (#3b82f6) to emerald green (#10b981)
- Include subtle visual elements representing: AI, voice/audio waves, recruitment/hiring
- Professional, corporate aesthetic
- Correct spelling: "ATS.me" with the period before "me"
- Clean, uncluttered design
- Text should be large and readable when scaled down

Style: Modern SaaS marketing material. Premium feel.`;
    } else {
      throw new Error('Invalid logo type. Use: icon, horizontal, horizontal-white, or og-image');
    }

    console.log(`Generating ${type} logo...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      throw new Error('No image generated in response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        imageUrl,
        message: textResponse || `${type} logo generated successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Logo generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
