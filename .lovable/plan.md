
# Generate Missing OG Images for All Pages

## Problem
The `ogImageUtils.ts` file references 10 page-specific OG images that **do not exist** in the `/public` directory. When these pages are shared on social media (LinkedIn, X, Facebook, iMessage), they either show a broken image or fall back to a generic preview.

### Missing OG Images
| Route | Expected File | Status |
|---|---|---|
| `/features` | `og-features.png` | Missing |
| `/jobs` | `og-jobs.png` | Missing |
| `/clients` | `og-clients.png` | Missing |
| `/contact` | `og-contact.png` | Missing |
| `/resources` | `og-resources.png` | Missing |
| `/demo` | `og-demo.png` | Missing |
| `/map` | `og-map.png` | Missing |
| `/privacy-policy` | `og-privacy.png` | Missing |
| `/terms-of-service` | `og-terms.png` | Missing |
| `/sitemap` | `og-sitemap.png` | Missing |

### Existing OG Images (no action needed)
`og-image.png` (homepage default), `og-audio.jpg`, `og-blog.png`, `og-blog-*.png` variants, `og-founders-pass.png`, `og-social.png`, `og-voice-demo.png`

---

## Approach

Use the existing `generate-image` edge function to create all 10 missing OG images. Each image will be generated with the **pro model** (`google/gemini-3-pro-image-preview`) for higher quality, then stored in the `page-assets` Supabase storage bucket. After generation, `ogImageUtils.ts` will be updated to point to the Supabase storage URLs instead of the non-existent `/public` paths.

### Brand Guidelines for Image Generation
- **Dimensions:** 1200x630px (OG standard)
- **Primary color:** Blue (`hsl(220, 85%, 55%)` / approx `#2563EB`)
- **Secondary color:** Purple (`hsl(260, 75%, 65%)`)
- **Accent:** Teal (`hsl(175, 80%, 45%)`)
- **Font reference:** Space Grotesk / Inter
- **Style:** Professional, clean, modern SaaS aesthetic with the "Apply AI" brand name prominent
- **Logo:** The icon features three vertical bars (equalizer-style) inside a rounded blue rectangle

### Image Prompts (one per page)

Each prompt will follow a consistent template:

> Create a professional 1200x630 Open Graph social sharing image for [PAGE PURPOSE]. Use a dark navy-to-blue gradient background (#0f172a to #2563EB). Include the text "Apply AI" prominently in white bold sans-serif font, with a tagline "[PAGE TAGLINE]" below it in lighter text. Add subtle tech-inspired geometric patterns or grid lines. Include a simplified icon representing [PAGE CONCEPT]. Clean, modern SaaS branding style. No photographs of people.

Specific prompts per page:
1. **Features** -- tagline: "AI-Powered Recruitment Features", icon: feature grid/dashboard
2. **Jobs** -- tagline: "Browse Open Positions", icon: briefcase/job board
3. **Clients** -- tagline: "Trusted by Leading Companies", icon: handshake/building
4. **Contact** -- tagline: "Get in Touch", icon: envelope/chat bubble
5. **Resources** -- tagline: "Guides, Tools & Insights", icon: book/lightbulb
6. **Demo** -- tagline: "See Apply AI in Action", icon: play button/screen
7. **Map** -- tagline: "Jobs Near You", icon: map pin/globe
8. **Privacy** -- tagline: "Your Privacy Matters", icon: shield/lock
9. **Terms** -- tagline: "Terms of Service", icon: document/gavel
10. **Sitemap** -- tagline: "Site Navigation", icon: sitemap/tree

---

## Implementation Steps

### Step 1: Create a batch generation edge function
Create a new edge function `generate-og-images` that loops through all 10 prompts, calls the AI image model for each, uploads them to `page-assets` storage, and returns all URLs. This avoids calling the edge function 10 separate times manually.

### Step 2: Update `ogImageUtils.ts`
Replace the `BASE_URL + /og-*.png` references with the actual Supabase storage public URLs returned from generation. This ensures social crawlers can access the images at stable, publicly accessible URLs.

### Step 3: Update `index.html`
The homepage `og:image` meta tag in `index.html` currently points to a Google Cloud Storage URL. This will remain unchanged since `og-image.png` already exists, but we will verify consistency.

### Step 4: Verify with social debuggers
After deployment, the URLs can be validated using Facebook's Sharing Debugger, X Card Validator, and LinkedIn Post Inspector.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `supabase/functions/generate-og-images/index.ts` | **Create** -- batch generation function |
| `src/utils/ogImageUtils.ts` | **Modify** -- update URLs to Supabase storage paths |

---

## Risk & Considerations
- AI-generated images may need manual review for quality; the pro model produces better results but is slower
- Each image generation takes 10-30 seconds; batch of 10 could take 2-5 minutes total
- Storage bucket `page-assets` is already public, so URLs will be immediately accessible to social crawlers
- If any generation fails, the function will return partial results and can be re-run for failures only
