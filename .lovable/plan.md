

## Rocket Launch: One-Click Social Beacon Mass Publish

### Overview

Create a "Rocket Launch" feature where an admin can trigger mass publishing of all unpublished Social Beacon ad creatives to every connected social platform by sending the rocket emoji or clicking a launch button. This involves a new edge function for server-side orchestration and a frontend trigger integrated into the Ad Creative Studio.

---

### 1. New Edge Function: `launch-social-beacons`

**File:** `supabase/functions/launch-social-beacons/index.ts`

This edge function handles the bulk publishing orchestration:

- **Auth:** Verify the caller is an admin or super_admin using `serverAuth.ts`
- **Fetch targets:** Query `generated_ad_creatives` for all rows where `platforms_published` is empty or incomplete (i.e., status is draft/ready/queued)
- **Fetch connections:** Query `social_platform_connections` for all active connections (`is_active = true`) with valid access tokens
- **Platform dispatch:** For each creative x connected platform combination where `adCreativeSupported` is true:
  - **Facebook/Instagram:** POST to Graph API (`/{page_id}/feed` or `/{ig_user_id}/media`) using stored access token
  - **X (Twitter):** POST to `https://api.twitter.com/2/tweets` using OAuth tokens
  - **LinkedIn:** POST to `https://api.linkedin.com/v2/ugcPosts` using access token
  - **TikTok/Reddit:** Log as "queued" (no posting API credentials typically available yet)
- **Update records:** After each successful post, append the platform to `platforms_published` array and set `published_at`
- **Return summary:** `{ launched: number, failed: number, skipped: number, details: [...] }`

**Config:** Add to `supabase/config.toml`:
```toml
[functions.launch-social-beacons]
verify_jwt = false
```

---

### 2. Frontend: Rocket Launch Trigger

**File:** `src/features/social-engagement/hooks/useRocketLaunch.ts` (new)

A custom hook that:
- Exposes a `launchAll()` mutation that invokes the `launch-social-beacons` edge function
- Tracks `isLaunching` state and results
- Shows toast notifications with launch summary

**File:** `src/features/social-engagement/components/admin/RocketLaunchButton.tsx` (new)

A button component with:
- Rocket icon and "Launch All" label
- Confirmation dialog (AlertDialog) before executing: "This will publish X unpublished creatives to all connected platforms. Continue?"
- Loading state with animated rocket icon during launch
- Results summary toast showing launched/failed/skipped counts

---

### 3. Integration into Ad Creative Studio

**File:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`

- Add the `RocketLaunchButton` next to the existing "Create New" button in the gallery tab header
- Only visible to admin/super_admin roles

**File:** `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx`

- Add a `RocketLaunchButton` in the gallery header alongside "Create New"
- Show badge with count of unpublished creatives

---

### 4. Rocket Emoji Input Detection

**File:** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`

- Add a hidden keyboard listener on the custom prompt `Textarea`
- When the value is exactly the rocket emoji, auto-trigger the launch flow (with confirmation dialog)
- Alternative: Add a small easter-egg detection in the studio that watches for the emoji input anywhere on the page

---

### 5. Database: Add `status` column to `generated_ad_creatives`

**Migration SQL:**
```sql
ALTER TABLE generated_ad_creatives 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Index for efficient filtering of launchable creatives
CREATE INDEX IF NOT EXISTS idx_ad_creatives_status 
  ON generated_ad_creatives(status) 
  WHERE status IN ('draft', 'ready', 'queued');
```

This enables filtering by `draft`, `ready`, `queued`, `published`, and `failed` states.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/launch-social-beacons/index.ts` | Create | Edge function for bulk platform publishing |
| `supabase/config.toml` | Edit | Add JWT config for new function |
| `src/features/social-engagement/hooks/useRocketLaunch.ts` | Create | Hook for launching and tracking results |
| `src/features/social-engagement/components/admin/RocketLaunchButton.tsx` | Create | UI button with confirmation dialog |
| `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` | Edit | Add rocket button and emoji detection |
| `src/features/social-engagement/components/admin/SavedCreativesGallery.tsx` | Edit | Add rocket button to gallery header |
| Database migration | Execute | Add `status` column to `generated_ad_creatives` |

### Security

- Edge function validates admin/super_admin role server-side before executing
- All platform API calls use stored OAuth tokens from `social_platform_connections`
- Launch events are logged to `audit_logs` for traceability
- Confirmation dialog prevents accidental mass publishing

