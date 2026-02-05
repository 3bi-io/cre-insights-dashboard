
# Plan: Add Social Embed Apply Route

## Overview
Create a new route component that enables the URL pattern `/s/{platform}/embed/apply?job_id=...` to redirect to `/embed/apply` with proper UTM tracking parameters, consistent with the existing `/s/{platform}/apply/{jobId}` pattern.

## Current State
- `/embed/apply` exists and displays client name, logo, and job location when `job_id` is provided
- `/s/:platform/apply/:jobId` exists (SocialApply.tsx) and redirects to `/apply` with UTM parameters
- No route exists for `/s/:platform/embed/apply`

## Solution

### 1. Create SocialEmbedApply Component
**File:** `src/pages/SocialEmbedApply.tsx`

A lightweight redirect component that:
- Extracts the platform from the URL path (`/s/:platform/embed/apply`)
- Looks up platform-specific UTM configuration (reusing `PLATFORM_CONFIG` from SocialApply)
- Preserves all query parameters (especially `job_id`)
- Adds `utm_source` and `utm_medium` based on platform
- Redirects to `/embed/apply?job_id=...&utm_source=...&utm_medium=...`

```text
URL Flow:
/s/indeed/embed/apply?job_id=xyz
         │
         ▼
┌─────────────────────────────┐
│   SocialEmbedApply.tsx      │
│   • Extract platform        │
│   • Lookup UTM config       │
│   • Preserve job_id         │
│   • Build redirect URL      │
└─────────────────────────────┘
         │
         ▼
/embed/apply?job_id=xyz&utm_source=indeed&utm_medium=job_board
```

### 2. Add Route to AppRoutes.tsx
**File:** `src/components/routing/AppRoutes.tsx`

Add lazy import and route definition near other social apply routes (around line 185):

```tsx
// Add import
const SocialEmbedApply = React.lazy(() => import("@/pages/SocialEmbedApply"));

// Add route (after line 185)
<Route path="/s/:platform/embed/apply" element={<RouteWrapper><SocialEmbedApply /></RouteWrapper>} />
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/SocialEmbedApply.tsx` | Create | New redirect component for social embed URLs |
| `src/components/routing/AppRoutes.tsx` | Modify | Add lazy import and route definition |

## Platform Support
The new route will support all platforms already defined in `PLATFORM_CONFIG`:
- **Social Networks:** x, twitter, linkedin, facebook, instagram, tiktok
- **Job Boards:** indeed, glassdoor, ziprecruiter, monster, cdllife, truckerpath
- **Other:** email, sms, qr, referral

## Example URLs After Implementation
| Input URL | Redirects To |
|-----------|--------------|
| `/s/indeed/embed/apply?job_id=abc123` | `/embed/apply?job_id=abc123&utm_source=indeed&utm_medium=job_board` |
| `/s/linkedin/embed/apply?job_id=abc123` | `/embed/apply?job_id=abc123&utm_source=linkedin&utm_medium=hiring` |
| `/s/facebook/embed/apply?job_id=abc123` | `/embed/apply?job_id=abc123&utm_source=facebook&utm_medium=social` |

## Verification
After implementation, test the following URL:
```
https://ats.me/s/indeed/embed/apply?job_id=965484d2-b778-4d8e-8424-ee7d97a92cc8
```

Expected behavior:
1. Redirects to `/embed/apply?job_id=965484d2-b778-4d8e-8424-ee7d97a92cc8&utm_source=indeed&utm_medium=job_board`
2. Displays client logo, name, job title, and location from the job listing
3. Form submissions are tagged with the UTM parameters for attribution tracking
