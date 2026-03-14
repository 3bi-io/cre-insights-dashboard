import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('generate-logo');

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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
      prompt = `Create a professional, modern logo icon for "Apply AI" - an AI-powered voice recruitment platform. 

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
      prompt = `Create a professional horizontal logo for "Apply AI" - an AI-powered voice recruitment platform.

Design requirements:
- Icon on the left side + "Apply AI" text on the right
- The icon should represent AI voice technology (soundwave + neural nodes)
- Text "Apply AI" in clean, modern sans-serif font (like Inter or SF Pro)
- Use vibrant blue (#3b82f6) as primary color with emerald green (#10b981) accent
- Dark text version for light backgrounds
- Modern, tech-forward, trustworthy aesthetic
- Correct spelling: "Apply AI"
- 16:9 aspect ratio suitable for website headers
- Solid white background
- Professional and corporate appropriate

Style: Modern SaaS logo lockup. Clean typography, balanced spacing.`;
    } else if (type === 'horizontal-white') {
      prompt = `Create a professional horizontal logo for "Apply AI" - an AI-powered voice recruitment platform.

Design requirements:
- Icon on the left side + "Apply AI" text on the right
- The icon should represent AI voice technology (soundwave + neural nodes)
- Text "Apply AI" in clean, modern sans-serif font (like Inter or SF Pro)
- WHITE/light colored icon and text for dark backgrounds
- Use vibrant blue (#3b82f6) and emerald green (#10b981) accents in the icon
- Modern, tech-forward, trustworthy aesthetic
- Correct spelling: "Apply AI"
- 16:9 aspect ratio suitable for website headers
- Transparent or dark background (#1a1a2e)
- Professional and corporate appropriate

Style: Modern SaaS logo lockup for dark mode. Clean white typography, balanced spacing.`;
    } else if (type === 'og-image') {
      prompt = `Create a stunning, premium social media preview image (Open Graph) for "Apply AI" - an AI-powered voice recruitment platform.

CRITICAL SPELLING: The brand name is "Apply AI".

Design requirements:
- Exact dimensions: 1200x630 pixels aspect ratio (16:9 landscape)
- Layout: Clean left-aligned logo area with "Apply AI" text prominently displayed
- Tagline below logo: "AI-Powered Voice Recruitment"
- Background: Stunning premium gradient flowing from vibrant blue (#3b82f6) on left to emerald green (#10b981) on right, with subtle dark overlay for depth
- Include elegant visual elements representing platform capabilities:
  • Stylized soundwave/audio visualization (voice technology)
  • Abstract neural network connections/nodes (AI intelligence)
  • Subtle speed lines or motion blur (instant 24/7 callbacks)
  • Modern geometric shapes for tech aesthetic
- Typography: Bold, clean sans-serif font (like Inter or SF Pro), white text, highly readable at thumbnail size
- Add subtle glow effects, gradient overlays, and depth without clutter
- Professional enterprise SaaS feel - premium like Salesforce, Slack, or HubSpot

Key visual messages:
- Speed and instant response capability
- AI intelligence and smart automation
- Voice/communication technology
- Modern, trustworthy, enterprise-ready platform

Style: Ultra-modern SaaS marketing material with premium tech aesthetic. Clean but visually striking.`;
    } else if (type === 'premium-soundwave') {
      prompt = `Create a premium horizontal logo for "Apply AI" - an AI-powered voice recruitment platform.

CRITICAL DESIGN - Replicate this exact premium style:
- Soundwave icon on the left: 5-7 vertical bars of varying heights forming an elegant audio waveform, emerald/teal green color (#10b981 to #14b8a6)
- Text "Apply AI" next to the icon - clean, modern sans-serif font (Inter or Montserrat style), pure white color
- Tagline "AI Powered Voice Recruitment" below the main text in smaller, lighter weight font
- Dark navy/teal gradient background (approximately #0a1628 flowing to #0d3d38)
- Premium particle flow effect in background with glowing dots/particles
- Elegant luminous wave curve flowing through the background creating depth
- Bokeh-style glowing orbs scattered in the background for premium feel

Typography specifications:
- "Apply AI" - white (#ffffff), bold modern sans-serif weight
- Tagline - smaller size, lighter weight, same font family, slightly muted white

Color palette:
- Primary icon: Emerald/teal green (#10b981 to #14b8a6)
- Background: Deep dark navy to teal gradient (#0a1628 to #0d4d40)
- Text: Pure white (#ffffff)
- Particle accents: Glowing teal and blue particles with soft glow

Dimensions: 16:9 aspect ratio, suitable for hero sections and marketing

Style: Ultra-premium, modern SaaS branding. High-end tech company aesthetic like Vercel, Linear, or Stripe. Clean but with stunning depth and sophistication.`;
    } else if (type === 'premium-icon') {
      prompt = `Create a premium square icon for "Apply AI" - an AI-powered voice recruitment platform.

Design requirements:
- Square format, perfect for favicon and app icons
- Soundwave/audio waveform design: 5-7 vertical bars of varying heights
- Colors: Emerald/teal green (#10b981 to #14b8a6) bars
- Dark navy background (#0a1628) with subtle gradient
- Optional: Subtle glow effect around the soundwave bars
- Clean, minimal, instantly recognizable at small sizes (32px)
- No text, icon only
- Modern, premium tech aesthetic

Style: Minimalist tech icon like Linear, Vercel, or Notion. Clean geometry with premium feel.`;
    } else if (type === 'premium-og') {
      prompt = `Create a stunning premium social media preview image (Open Graph) for "Apply AI" - an AI-powered voice recruitment platform.

CRITICAL DESIGN - Match the premium soundwave branding:
- Dimensions: 1200x630 pixels (16:9 landscape)
- Left side: Soundwave icon (5-7 vertical bars, emerald green #10b981) + "Apply AI" text in white
- Tagline: "AI Powered Voice Recruitment" below the logo
- Background: Premium dark navy to teal gradient (#0a1628 to #0d4d40)
- Include flowing particle effects and luminous wave curves in background
- Bokeh-style glowing orbs for depth and premium feel
- Subtle soundwave visualization elements flowing across the design

Visual elements to include:
- Glowing particles flowing from left to right
- Elegant curved luminous lines
- Soft depth-of-field bokeh effects
- Abstract neural network nodes (subtle, in background)

Typography:
- "Apply AI" - large, bold white sans-serif
- Tagline - smaller, lighter weight, white

Style: Ultra-premium tech marketing. Dark, sophisticated, modern. Like Vercel, Linear, or high-end SaaS company marketing materials.`;
    } else {
      throw new Error('Invalid logo type. Use: icon, horizontal, horizontal-white, og-image, premium-soundwave, premium-icon, or premium-og');
    }

    logger.info(`Generating ${type} logo...`);

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
      logger.error('AI Gateway error', { status: response.status, error: errorText });
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.info('AI response received');

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
    logger.error('Logo generation error', error);
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
