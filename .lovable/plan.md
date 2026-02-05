

# Plan: Dynamic OG Image Implementation for All Pages

## Overview
This plan implements dynamic Open Graph (OG) images for every page, using a screenshot-based approach to generate page previews as social sharing images. The homepage will retain the existing branded OG image while all other pages will use dynamically generated screenshots.

## Current State

### Existing OG Image Assets
- `public/og-image.png` - Default branded image
- `public/og-image-new.png` - Alternative branded image
- `public/og-image-premium.png` - Premium branded image
- `public/og-voice-demo.png` - Voice demo specific image
- `public/og-social.png` - Social sharing image

### Current Implementation
- The `SEO` component defaults to `https://ats.me/og-image.png`
- Only the VoiceAgentDemo page overrides with a custom `ogImage` prop
- All other pages use the default global image

### Public Pages Requiring Dynamic OG Images
| Route | Page | Current OG Image |
|-------|------|------------------|
| `/` | LandingPage | Keep default (branded) |
| `/jobs` | JobsPage | Dynamic screenshot |
| `/jobs/:id` | JobDetailsPage | Dynamic screenshot |
| `/clients` | ClientsPage | Dynamic screenshot |
| `/features` | FeaturesPage | Dynamic screenshot |
| `/contact` | ContactPage | Dynamic screenshot |
| `/resources` | ResourcesPage | Dynamic screenshot |
| `/demo` | DemoPage | Dynamic screenshot |
| `/map` | JobMapPage | Dynamic screenshot |
| `/privacy-policy` | PrivacyPolicyPage | Dynamic screenshot |
| `/terms-of-service` | TermsOfServicePage | Dynamic screenshot |
| `/cookie-policy` | CookiePolicyPage | Dynamic screenshot |
| `/sitemap` | SitemapPage | Dynamic screenshot |

## Implementation Approach

### Option 1: Urlbox/ScreenshotOne API (Recommended)
Use a screenshot API service to dynamically generate OG images from page URLs.

**Pros:**
- True page previews - shows exactly what the page looks like
- Automatic updates when content changes
- No manual image creation needed

**Cons:**
- Requires third-party service subscription
- API costs per screenshot generated
- Caching strategy needed for performance

### Option 2: Satori/Kalai-style Dynamic Generation
Generate SVG-based OG images at runtime using page metadata.

**Pros:**
- No external dependencies after setup
- Fast generation
- Fully customizable templates

**Cons:**
- Requires edge function for image generation
- Limited to text/simple graphics (not true page screenshots)

### Recommended: Hybrid Approach
1. **Homepage**: Keep existing branded `og-image.png`
2. **Static pages** (Features, Contact, etc.): Pre-generate static OG images with Urlbox/screenshot tool
3. **Dynamic pages** (Job details): Use screenshot API with caching

## Technical Implementation

### 1. Create OG Image Utility
**File:** `src/utils/ogImageUtils.ts`

```typescript
// Helper to determine OG image URL based on route
export function getOgImageUrl(pathname: string): string {
  // Homepage keeps branded image
  if (pathname === '/' || pathname === '') {
    return 'https://ats.me/og-image.png';
  }
  
  // Static page-specific images
  const staticOgImages: Record<string, string> = {
    '/features': 'https://ats.me/og-features.png',
    '/contact': 'https://ats.me/og-contact.png',
    '/jobs': 'https://ats.me/og-jobs.png',
    '/demo': 'https://ats.me/og-demo.png',
    '/clients': 'https://ats.me/og-clients.png',
    '/resources': 'https://ats.me/og-resources.png',
    '/map': 'https://ats.me/og-map.png',
  };
  
  if (staticOgImages[pathname]) {
    return staticOgImages[pathname];
  }
  
  // Dynamic job pages - use screenshot API
  if (pathname.startsWith('/jobs/')) {
    const jobId = pathname.split('/')[2];
    return `https://api.screenshotone.com/take?url=${encodeURIComponent(`https://ats.me${pathname}`)}&viewport_width=1200&viewport_height=630&format=png`;
  }
  
  // Default fallback
  return 'https://ats.me/og-image.png';
}
```

### 2. Update SEO Component
**File:** `src/components/SEO.tsx`

Update the component to accept a helper for determining OG images:

```typescript
// Add import
import { getOgImageUrl } from '@/utils/ogImageUtils';

// Update component to use route-aware OG image
const pathname = window.location.pathname;
const defaultOgImage = getOgImageUrl(pathname);
```

### 3. Pre-generate Static OG Images
For consistent branding, create page-specific OG images:

| Image File | Dimensions | Content |
|------------|------------|---------|
| `og-features.png` | 1200x630 | Features page hero screenshot |
| `og-contact.png` | 1200x630 | Contact page screenshot |
| `og-jobs.png` | 1200x630 | Jobs listing page screenshot |
| `og-demo.png` | 1200x630 | Demo page screenshot |
| `og-clients.png` | 1200x630 | Companies page screenshot |
| `og-resources.png` | 1200x630 | Resources page screenshot |
| `og-map.png` | 1200x630 | Job map page screenshot |

### 4. Update Each Public Page
Add explicit `ogImage` prop to SEO component on all public pages:

**Example - FeaturesPage.tsx:**
```typescript
<SEO
  title="Features | Social Beacon, AI Screening & Voice Apply"
  description="..."
  ogImage="https://ats.me/og-features.png"  // Add this line
  ...
/>
```

## Files to Modify

1. **Create:** `src/utils/ogImageUtils.ts` - OG image URL helper
2. **Update:** `src/components/SEO.tsx` - Use route-aware defaults
3. **Update:** `src/pages/public/FeaturesPage.tsx` - Add ogImage prop
4. **Update:** `src/pages/public/ContactPage.tsx` - Add ogImage prop
5. **Update:** `src/pages/public/JobsPage.tsx` - Add ogImage prop
6. **Update:** `src/pages/public/JobDetailsPage.tsx` - Add dynamic ogImage
7. **Update:** `src/pages/public/ClientsPage.tsx` - Add ogImage prop
8. **Update:** `src/pages/public/ResourcesPage.tsx` - Add ogImage prop
9. **Update:** `src/pages/public/DemoPage.tsx` - Add ogImage prop
10. **Update:** `src/pages/public/JobMapPage.tsx` - Add ogImage prop
11. **Update:** `src/pages/public/PrivacyPolicyPage.tsx` - Add ogImage prop
12. **Update:** `src/pages/public/TermsOfServicePage.tsx` - Add ogImage prop
13. **Update:** `src/pages/public/CookiePolicyPage.tsx` - Add ogImage prop
14. **Update:** `src/pages/public/SitemapPage.tsx` - Add ogImage prop
15. **Create:** Static OG images in `public/` directory

## Screenshot Generation Strategy

### For Static Pages (One-time)
1. Deploy current site to production
2. Use browser screenshot tool or Urlbox to capture each page
3. Save as `og-{page-name}.png` in `public/` folder
4. Dimensions: 1200x630 pixels

### For Dynamic Job Pages
**Option A - Edge Function with Caching:**
Create `supabase/functions/og-image/` that:
1. Receives job ID
2. Checks cache for existing image
3. If not cached, calls screenshot API
4. Stores in Supabase Storage
5. Returns cached URL

**Option B - Direct Screenshot API:**
Use query parameters directly in the OG tag pointing to screenshot service.

## Verification Steps
After implementation:
1. Test social sharing preview for homepage (should show branded image)
2. Test social sharing preview for `/features` (should show features-specific image)
3. Test social sharing preview for a job detail page (should show job-specific preview)
4. Use Facebook Sharing Debugger to verify OG tags
5. Use Twitter Card Validator to verify Twitter cards

## Cost Considerations

### Screenshot API Services
- **Urlbox**: ~$49/month for 10,000 screenshots
- **ScreenshotOne**: ~$19/month for 5,000 screenshots
- **Puppeteer/Playwright**: Free but requires hosting

### Recommendation
Start with pre-generated static images for main pages, then evaluate if dynamic generation is needed for job details based on social sharing analytics.

