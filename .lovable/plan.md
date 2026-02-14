

## Social Beacon Comprehensive Optimization -- Best-in-Class Refactor

### Overview

This plan upgrades every Social Beacon component to production-grade quality: upgrading the AI image model from `gemini-2.5-flash-image` to `gemini-3-pro-image-preview` for higher-quality ad creatives, fixing CORS headers, improving mobile responsiveness across all admin panels, and refactoring components for better UX patterns.

---

### 1. Edge Function: Upgrade AI Image Model and Fix Issues

**File: `supabase/functions/generate-ad-creative/index.ts`**

| Issue | Fix |
|-------|-----|
| Image model uses `gemini-2.5-flash-image` (lower quality) | Upgrade to `google/gemini-3-pro-image-preview` for best-in-class ad images |
| Text model uses `gemini-2.5-flash` | Upgrade to `google/gemini-3-flash-preview` (latest, faster) |
| CORS headers missing required Supabase client headers | Add `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version` |
| No 429/402 error handling on image generation branch (silently continues) | Surface rate limit and credit errors to the user with `imageError` field in response |
| Base64 images returned directly (huge payloads) | Add a warning comment but keep base64 for now (storage upload is a future enhancement) |
| Tool-calling not used for structured output | Switch text generation to use tool calling for reliable JSON extraction instead of regex parsing |

**Key changes:**
- Model: `google/gemini-3-flash-preview` for text, `google/gemini-3-pro-image-preview` for images
- Use tool calling (`tools` + `tool_choice`) to extract headline/body/hashtags/callToAction reliably (no more regex JSON parsing)
- Add `imageError` field to response so frontend can show "Image generation failed" gracefully
- Expand CORS headers

---

### 2. Ad Creative Studio -- Mobile-First Refactor

**File: `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`**

| Issue | Fix |
|-------|-----|
| Two-column grid breaks on mobile | Stack vertically on mobile (`grid-cols-1 lg:grid-cols-2`) |
| Company details grid is `grid-cols-2` always | Change to `grid-cols-1 sm:grid-cols-2` |
| Media type / aspect ratio grid is `grid-cols-2` always | Change to `grid-cols-1 sm:grid-cols-2` |
| No loading feedback on image generation time (can take 10-20s) | Add progress indicator text that updates during generation |
| No image generation error feedback | Show toast when `imageError` returned from edge function |
| Benefits require at least 1 to generate (no user hint) | Add helper text showing "Select at least 1 benefit" |

---

### 3. Ad Preview Card -- Enhanced Platform Fidelity

**File: `src/features/social-engagement/components/admin/AdPreviewCard.tsx`**

| Issue | Fix |
|-------|-----|
| Footer uses emoji for Like/Comment/Share (not professional) | Replace with Lucide icons (Heart, MessageSquare, Share2, Send) matching each platform |
| WhatsApp icon renders `null` | Use `MessageCircle` from lucide-react |
| No image loading/error states | Add `onError` fallback and loading skeleton for images |
| Missing responsive padding on mobile | Reduce padding on `< sm` screens |

---

### 4. Platform Preview Tabs -- Mobile Fix

**File: `src/features/social-engagement/components/admin/PlatformPreviewTabs.tsx`**

| Issue | Fix |
|-------|-----|
| `grid-cols-5` on all screens | Change to scrollable horizontal on mobile with `overflow-x-auto` |
| Labels hidden on mobile but icons too small without context | Show abbreviated labels (X, FB, IG, LI, TT) on all screens |

---

### 5. Saved Creatives Gallery -- Mobile Optimization

**File: `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx`**

| Issue | Fix |
|-------|-----|
| Filter row stacks poorly on small screens | Make search full-width on mobile, filters in a row below |
| Grid is `sm:grid-cols-2 lg:grid-cols-3` | Change to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (already close, verify) |
| View mode toggle is unnecessary on mobile | Hide view mode on `< sm`, default to grid |

---

### 6. Creative Card -- UX Polish

**File: `src/features/social-engagement/components/admin/CreativeCard.tsx`**

| Issue | Fix |
|-------|-----|
| `window.confirm` for delete (not accessible) | Replace with AlertDialog from Radix UI |
| Benefits show raw IDs like `sign_on_bonus` | Map to human labels using `BENEFIT_LABELS` |
| No published platforms indicator | Show platform badges from `platforms_published` |

---

### 7. Export Menu -- Stability

**File: `src/features/social-engagement/components/admin/ExportMenu.tsx`**

| Issue | Fix |
|-------|-----|
| Share link uses `btoa()` which can fail on Unicode | Use `encodeURIComponent` + base64 safely |
| No error boundary around clipboard operations | Wrap all clipboard calls in try/catch with fallback |

---

### 8. Super Admin Social Beacons Page -- Responsive Tabs

**File: `src/features/social-engagement/pages/SuperAdminSocialBeacons.tsx`**

| Issue | Fix |
|-------|-----|
| TabsList is `grid-cols-5` on desktop, scrollable on mobile | Already handled with overflow, verify icons don't clip |
| No visual indicator of which tabs have data | Add dot badge on Analytics tab when data exists |

---

### 9. Benefit Toggle Group -- Touch Target Fix

**File: `src/features/social-engagement/components/admin/BenefitToggle.tsx`**

| Issue | Fix |
|-------|-----|
| `grid-cols-2` always | Change to `grid-cols-1 sm:grid-cols-2` for mobile readability |
| Touch targets are borderline at `px-3 py-2` | Increase to `px-4 py-3` on mobile for accessibility |

---

### 10. Platform Credentials Manager -- Mobile Grid

**File: `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx`**

| Issue | Fix |
|-------|-----|
| Grid is `md:grid-cols-2 lg:grid-cols-3` | Add `grid-cols-1` base explicitly |
| `window.location.reload()` in refresh handler | Remove -- `verifyAllSecrets()` already refreshes data |

---

### 11. Social Engagement Dashboard -- Responsive & Polish

**File: `src/features/social-engagement/pages/SocialEngagementDashboard.tsx`**

| Issue | Fix |
|-------|-----|
| Quick stats grid `md:grid-cols-4` jumps from 1 to 4 | Add `grid-cols-2 md:grid-cols-4` for 2-column on tablets |
| Connections tab hardcodes `twitter` instead of `x` | Fix to use `x` to match the platform key |
| Platform list missing `tiktok` and `reddit` | Add all 7 platforms to connections grid |

---

### 12. Global Settings Panel -- No Changes Needed
Already well-structured with responsive grid and proper form patterns.

---

### 13. OAuth Config Panel -- Minor Polish

**File: `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx`**

| Issue | Fix |
|-------|-----|
| Grid is `md:grid-cols-2` | Already good, verify mobile stacking |
| Copy button uses raw `navigator.clipboard` | Use the `copyToClipboard` utility for consistent error handling |

---

### Files Changed Summary

| File | Type | Key Change |
|------|------|------------|
| `supabase/functions/generate-ad-creative/index.ts` | Refactor | Upgrade to `gemini-3-pro-image-preview` + `gemini-3-flash-preview`, tool calling, better error handling |
| `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` | Refactor | Mobile-first grid, image error feedback, generation progress |
| `src/features/social-engagement/components/admin/AdPreviewCard.tsx` | Refactor | Platform-accurate footer icons, WhatsApp icon fix, image error states |
| `src/features/social-engagement/components/admin/PlatformPreviewTabs.tsx` | Refactor | Mobile scrollable tabs with abbreviated labels |
| `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx` | Polish | Mobile filter layout, view mode visibility |
| `src/features/social-engagement/components/admin/CreativeCard.tsx` | Refactor | AlertDialog for delete, benefit label mapping, platform badges |
| `src/features/social-engagement/components/admin/ExportMenu.tsx` | Fix | Safe Unicode handling, clipboard error boundary |
| `src/features/social-engagement/components/admin/BenefitToggle.tsx` | Polish | Mobile-friendly grid and touch targets |
| `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx` | Fix | Remove page reload, explicit mobile grid |
| `src/features/social-engagement/pages/SocialEngagementDashboard.tsx` | Fix | Fix `twitter` to `x`, add missing platforms, responsive stats grid |
| `src/features/social-engagement/pages/SuperAdminSocialBeacons.tsx` | Polish | Tab indicator badges |
| `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx` | Polish | Consistent clipboard utility |

### Performance Impact
- Higher quality AI-generated images (Pro model vs Flash)
- More reliable JSON extraction via tool calling (no regex failures)
- Better mobile experience across all admin panels
- Elimination of `window.location.reload()` for smoother UX

