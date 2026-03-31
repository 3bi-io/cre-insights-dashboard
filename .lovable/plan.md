

# Add Consistent Tracking for Facebook, X, and TikTok

## Current State
- **X**: Has dedicated `/x/apply/:jobId` route, copy button, and URL builder -- fully set up.
- **Facebook**: Has a "Facebook (with UTM)" copy button but uses generic UTM params (not a dedicated route). No dedicated route like `/fb/apply/:jobId`. In-app browser detection works (FBAN/FBAV).
- **TikTok**: No dedicated route, no copy button, no URL builder. TikTok in-app browser not detected as mobile in `getDeviceType`.
- **Generic**: `/s/:platform/apply/:jobId` exists and supports all platforms, but no short aliases like `/fb/` or `/tt/`.

## Changes

### 1. Add dedicated routes for Facebook and TikTok
Create `src/pages/FacebookApply.tsx` and `src/pages/TikTokApply.tsx` (same pattern as `XApply.tsx`) that redirect to `/apply` with platform-specific UTM params.

Register routes in `AppRoutes.tsx`:
- `/fb/apply/:jobId` → FacebookApply
- `/tt/apply/:jobId` → TikTokApply

### 2. Add URL builders in `useJobShortLinks.ts`
Add `buildFacebookApplyUrl` and `buildTikTokApplyUrl` functions matching the `buildXApplyUrl` pattern.

### 3. Update CopyApplyLinkButton
Replace the generic "Facebook (with UTM)" button with a dedicated "Facebook" button using the new route. Add "TikTok" button. Add proper icons for each platform.

### 4. Fix device detection for TikTok in-app browser
In `usePageTracking.tsx`, add TikTok's in-app browser UA string (`musical_ly`, `BytedanceWebview`, `TikTok`) to the mobile detection regex alongside Instagram and Facebook.

### 5. Update source classifier to include TikTok and X
In `usePageTracking.tsx`, update `classifySource` to recognize `tiktok`, `x.com`, and `t.co` referrers as "Social".

## Technical Details
- All three platforms will have: dedicated short route → `/apply` redirect with UTM → tracked in `page_views` with `utm_source` and `utm_medium`.
- In-app browser detection covers Instagram, Facebook, and TikTok for accurate `device_type`.
- The `classifySource` function in `visitor_sessions` will correctly categorize all social traffic.

