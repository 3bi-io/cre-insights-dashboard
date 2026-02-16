
# Generate a Founders Pass Ad Creative for Social Beacon Distribution

## What We'll Build

A dedicated edge function call that generates a premium Founders Pass recruitment marketing image using the high-quality `google/gemini-3-pro-image-preview` model, persists it to the `page-assets` storage bucket, and saves it as a ready-to-launch ad creative in the `generated_ad_creatives` table for Social Beacon distribution.

## Approach

Rather than building new infrastructure, we'll leverage the existing `generate-ad-creative` edge function (which already uses the pro image model) and the `generate-image` function (which handles storage persistence). We'll create a small utility edge function or script page that:

1. Generates a premium Founders Pass image with a carefully crafted prompt
2. Persists it to Supabase storage (not the database)
3. Saves a complete ad creative record (headline, body, hashtags, image URL) to `generated_ad_creatives` for one-click Social Beacon launch

## Image Generation Prompt (Crafted for Maximum Impact)

The prompt will be optimized for the Founders Pass value proposition:

> Create a cinematic, ultra-professional recruitment marketing image in 16:9 landscape format. Feature a modern semi-truck (Peterbilt or Kenworth style) on an expansive American highway at golden hour with dramatic sky lighting. The truck should be pristine, showing chrome details and professional fleet branding. Include subtle visual elements suggesting technology and innovation -- a faint digital overlay or holographic accent on the truck's cab suggesting AI-powered recruitment. The scene should convey opportunity, freedom, and professional excellence. Warm golden tones with deep blue sky contrast. No text, no words, no letters anywhere in the image. Photorealistic quality, cinematic composition with rule-of-thirds framing.

## Technical Changes

### 1. New Edge Function: `supabase/functions/generate-founders-pass-creative/index.ts`

A purpose-built function that:
- Uses `google/gemini-3-pro-image-preview` for the highest quality image
- Uses `google/gemini-3-flash-preview` with tool-calling for structured ad copy
- Uploads the image to the `page-assets` storage bucket (not base64 in DB)
- Inserts a complete record into `generated_ad_creatives` with status ready for Social Beacon launch
- Returns the public image URL and creative content

The ad copy will be tailored to the Founders Pass offer:
- Headline: Performance-based $3/apply messaging
- Body: Zero upfront cost, pay-per-apply value prop
- Hashtags: #CDLJobs, #TruckDrivers, #Hiring, #FoundersPass, #NowHiring
- CTA: "Apply Now"

### 2. Trigger Page: `src/pages/admin/GenerateFoundersPassCreative.tsx`

A simple admin page (or we add a button to the existing Ad Creative Studio) that triggers the generation with one click and displays the result -- showing the generated image, copy, and a "Launch via Social Beacon" button.

### 3. Route Registration

Add the admin page route to the router for easy access.

## Output

After running, the system will have:
- A high-resolution 16:9 marketing image stored in `page-assets` bucket
- A complete ad creative record in `generated_ad_creatives` ready for the existing Rocket Launch feature to distribute across all connected Social Beacon platforms (X, Facebook, Instagram, LinkedIn, TikTok, Reddit)

## Why This Approach

- Reuses existing AI gateway, storage, and Social Beacon infrastructure
- Image stored in blob storage (not database) per platform policy
- The creative is immediately available for the existing `launch-social-beacons` edge function to distribute
- Uses the pro image model for maximum visual quality
