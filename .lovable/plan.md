

## Add Images to Founders Pass Page

Enhance the Founders Pass page with relevant, professional imagery to increase visual impact and conversion potential. Images will be generated using the AI image generation API (via edge function) and stored in Supabase storage, then referenced by URL on the page.

### Image Placements

**1. Hero Section -- Background/Accent Image**
- A professional, high-quality image of diverse people in a workplace setting (aligned with the branding pivot to real-world photography style)
- Applied as a subtle background or side accent behind the hero text
- Semi-transparent overlay to maintain text readability

**2. Pricing Section -- Decorative Illustration**
- A clean, modern illustration or graphic representing performance-based value (e.g., upward metrics, connected nodes)
- Placed as a subtle accent near the pricing summary line

**3. How It Works Section -- Step Icons/Illustrations**
- Three small contextual illustrations for each step:
  - Step 1: Person at a laptop signing up
  - Step 2: Job listings going live across channels
  - Step 3: Dollar/performance metric visual
- Replace or complement the current numbered circles

**4. OG Image for Social Sharing**
- A dedicated `og-founders-pass.png` in `/public/` for link previews
- Branded with "Founders Pass -- $3/Apply" messaging

### Technical Approach

**New edge function: `generate-image`**
- Accepts a text prompt, calls the Nano banana image generation API
- Uploads the resulting image to a Supabase storage bucket (e.g., `page-assets`)
- Returns the public URL
- This allows generating images on-demand without storing base64 in the database

**Storage bucket: `page-assets`**
- Create a public Supabase storage bucket for page imagery
- Store generated images with descriptive filenames (e.g., `founders-pass-hero.webp`)

**Page updates (`FoundersPassPage.tsx`)**
- Add hero background image with dark gradient overlay for text contrast
- Add step illustrations in the "How It Works" section
- Add OG image meta tag via the SEO component

**New file: `src/features/landing/components/FoundersPassHero.tsx`**
- Extract hero section into its own component to manage image loading and responsive `srcset`

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-image/index.ts` | Create -- edge function for AI image generation |
| `src/pages/public/FoundersPassPage.tsx` | Modify -- add image elements to hero, steps, and OG meta |
| `public/og-founders-pass.png` | Create -- generated OG image for social previews |
| Supabase storage bucket `page-assets` | Create -- public bucket for generated images |

### Generation Prompts (for AI image model)

1. **Hero**: "Professional photo of a diverse team in a modern logistics office reviewing applicant data on screens, warm lighting, shallow depth of field, corporate editorial style"
2. **Step 1**: "Clean minimal illustration of a person signing up on a laptop, flat design, blue and white color scheme"
3. **Step 2**: "Clean minimal illustration of job listings broadcasting across multiple channels, flat design, blue and white color scheme"
4. **Step 3**: "Clean minimal illustration of a performance dashboard showing cost per application metrics, flat design, blue and white color scheme"
5. **OG Image**: "Marketing banner reading 'Founders Pass' with '$3 per apply' subtitle, dark gradient background, modern tech aesthetic, 1200x630px"

