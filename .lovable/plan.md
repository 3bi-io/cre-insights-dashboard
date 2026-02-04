

# Social Beacons Feature - Complete Review and Refactoring Plan

## Executive Summary

After thorough review of `/social-beacons` (Super Admin Social Beacons), I've identified that while the foundation is solid, **several key features are incomplete or non-functional**, and the UX can be significantly improved. The most critical gaps are:

1. **Image generation is not implemented** - The edge function returns `mediaUrl: null` 
2. **Video generation is not implemented** - Only appears as a UI option
3. **No saved creatives gallery** - Creatives are saved but not displayed
4. **Multi-platform preview not available** - Only shows X/Twitter preview
5. **No export functionality** - Export button exists but does nothing

## Current State Analysis

### What's Working Well
- Platform credentials verification via `verify-platform-secrets` edge function
- Platform configuration storage in `social_beacon_configurations` table
- OAuth flow for LinkedIn, Facebook, Instagram, Twitter
- Ad copy generation via Lovable AI (text only)
- Global settings management
- Analytics panel (mock data)

### Critical Gaps Identified

#### Gap 1: Image Generation Not Implemented
**File:** `supabase/functions/generate-ad-creative/index.ts` (line 171)
```typescript
mediaUrl: null, // Image generation would be a separate step
```
The edge function generates text but never generates images despite the UI offering AI image generation.

#### Gap 2: No Saved Creatives Gallery
**File:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`
The `useAdCreative` hook fetches `savedCreatives` but there's no UI component to display them.

#### Gap 3: Single Platform Preview Only
**File:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` (line 260-262)
```typescript
<AdPreviewCard 
  preview={currentPreview}
  platform="x"  // Hardcoded to X only
  isLoading={isGenerating}
/>
```

#### Gap 4: Export Button Non-Functional
**File:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` (lines 279-282)
```typescript
<Button variant="outline">
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>
```
No onClick handler attached.

#### Gap 5: Mock Analytics Data
**File:** `src/features/social-engagement/components/admin/SocialAnalyticsPanel.tsx`
All analytics are hardcoded mock data, not fetched from the database.

## Comprehensive Refactoring Plan

### Phase 1: Implement AI Image Generation

**File to Modify:** `supabase/functions/generate-ad-creative/index.ts`

Add image generation using the Lovable AI Gateway with `google/gemini-2.5-flash-image`:

```typescript
// After text generation, add image generation:
if (generateImage) {
  const imagePrompt = `Create a professional recruitment ad image for a ${jobTypeLabel} truck driver position.

Design requirements:
- ${aspectRatio} aspect ratio
- Professional, modern recruitment marketing style
- Feature trucking/transportation imagery
- Include visual elements for: ${benefitsList}
- Eye-catching but corporate appropriate
- High contrast for social media visibility
- No text in the image (text will be overlaid)

Style: Professional social media recruitment ad for ${companyName || 'a trucking company'}.`;

  const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: imagePrompt }],
      modalities: ["image", "text"],
    }),
  });

  if (imageResponse.ok) {
    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (imageUrl) {
      // Upload base64 to Supabase Storage and return public URL
      // Or return base64 directly for client-side display
    }
  }
}
```

### Phase 2: Create Saved Creatives Gallery Component

**New File:** `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx`

Create a gallery component to display saved creatives with:
- Grid layout of creative cards
- Quick preview on hover
- Actions: Edit, Delete, Publish, Duplicate
- Filter by job type, date, platform
- Pagination or infinite scroll
- Empty state with CTA to create first creative

### Phase 3: Multi-Platform Preview

**File to Modify:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`

Add platform tabs for preview:
- X (Twitter) - 280 char limit
- Facebook - Full content
- Instagram - 2200 char limit
- LinkedIn - 3000 char limit
- TikTok - Vertical video focus

**Enhance AdPreviewCard:**
- Show character count vs. limit
- Platform-specific styling (dark mode for X, blue for Facebook, etc.)
- Warning badges when content exceeds limits
- Platform-specific CTA button styles

### Phase 4: Implement Export Functionality

**File to Modify:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`

Add export capabilities:
- Download image as PNG/JPG
- Export text as formatted clipboard copy
- Export as JSON for API integration
- Generate shareable preview link

### Phase 5: Enhance Ad Creative Studio UX

**Complete UX Overhaul:**

1. **Split View Layout:**
   - Left: Configuration form
   - Center: Live preview (switchable platforms)
   - Right: Saved creatives sidebar (collapsible)

2. **Add AI Suggestions Panel:**
   - Auto-suggest benefits based on job type
   - Trending hashtags by industry
   - Optimal posting times by platform

3. **Batch Generation:**
   - Generate multiple variations at once
   - A/B test different headlines
   - Quick regenerate with variations

4. **Template System:**
   - Save configurations as reusable templates
   - Organization-wide template library
   - Quick apply templates

### Phase 6: Connect Real Analytics

**File to Modify:** `src/features/social-engagement/components/admin/SocialAnalyticsPanel.tsx`

Create hook and queries for:
- Real engagement data from `social_interactions` table
- Creative performance from `generated_ad_creatives` table
- Platform-wise breakdown from actual API responses
- Time-series charts with Recharts

### Phase 7: Video Generation Support (Future)

Add video generation using external services or AI video APIs:
- Short-form video for TikTok/Reels
- Animated text overlays
- Template-based video creation

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx` | Display saved ad creatives |
| `src/features/social-engagement/components/admin/CreativeCard.tsx` | Individual creative preview card |
| `src/features/social-engagement/components/admin/PlatformPreviewTabs.tsx` | Multi-platform preview switcher |
| `src/features/social-engagement/components/admin/ExportMenu.tsx` | Export options dropdown |
| `src/features/social-engagement/hooks/useAnalyticsDashboard.ts` | Real analytics data fetching |
| `src/features/social-engagement/utils/platformLimits.ts` | Character limits and validation |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-ad-creative/index.ts` | Add AI image generation |
| `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` | Complete UX overhaul |
| `src/features/social-engagement/components/admin/AdPreviewCard.tsx` | Platform-specific styling |
| `src/features/social-engagement/components/admin/SocialAnalyticsPanel.tsx` | Connect real data |
| `src/features/social-engagement/pages/SuperAdminSocialBeacons.tsx` | Add Creatives tab |

## Implementation Priority

1. **Critical (Phase 1):** Implement AI image generation - This is the most visible missing feature
2. **High (Phase 2-3):** Saved creatives gallery + multi-platform preview
3. **Medium (Phase 4-5):** Export functionality + UX enhancements
4. **Lower (Phase 6-7):** Real analytics + video generation

## Technical Considerations

### Image Generation
- Use `google/gemini-2.5-flash-image` for standard quality
- Use `google/gemini-3-pro-image-preview` for higher quality (consider as option)
- Store generated images in Supabase Storage for persistence
- Return both base64 for immediate preview and storage URL for saving

### Storage Management
- Create `ad-creatives` storage bucket
- Implement cleanup for orphaned images
- Set appropriate RLS policies for organization isolation

### Rate Limiting
- Add debounce on generate button
- Show clear feedback for rate limit errors (429)
- Queue multiple generation requests

## Expected Outcome

After implementation:
- Users can generate complete ad creatives with AI images
- Preview how ads will look across all supported platforms
- Save, manage, and reuse creatives
- Export creatives for use outside the platform
- Track real performance metrics
- Best-in-class social recruitment creative studio

