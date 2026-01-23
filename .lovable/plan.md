
# Hide General Application Job Listings from Public Visibility

## Overview

This plan adds an `is_hidden` column to the `job_listings` table and updates all public-facing queries to exclude hidden listings. General Application listings (created as fallbacks when no specific job matches an application) will be marked as hidden so they remain functional internally but invisible to visitors on the job board, search results, sitemaps, and XML feeds.

---

## Current State Analysis

### What are "General Application" Listings?
- Auto-created by `application-processor.ts` when an application doesn't match a specific job
- Identified by `title = 'General Application'` (or `'General Application - [Client Name]'`)
- Currently have `status = 'active'`, making them visible alongside regular job postings
- Located in: `supabase/functions/_shared/application-processor.ts` (lines 213-291)

### Public Visibility Points (13 locations need updates)

| Category | Location | File |
|----------|----------|------|
| **Job Boards** | Paginated public jobs | `src/hooks/usePaginatedPublicJobs.tsx` |
| | Candidate job search | `src/features/candidate/hooks/useJobSearch.ts` |
| | Job details page | `src/hooks/useJobDetails.tsx` |
| | Related jobs component | `src/components/public/RelatedJobs.tsx` |
| **SEO/Sitemaps** | Dynamic sitemap | `supabase/functions/generate-sitemap/index.ts` |
| | Google indexing | `supabase/functions/google-indexing/index.ts` |
| **XML Feeds** | Indeed feed | `supabase/functions/indeed-xml-feed/index.ts` |
| | Google Jobs XML | `supabase/functions/google-jobs-xml/index.ts` |
| | Universal XML feed | `supabase/functions/universal-xml-feed/index.ts` |
| | Job feed XML | `supabase/functions/job-feed-xml/index.ts` |
| **Admin/Dashboard** | Active jobs list | `src/pages/ActiveJobIds.tsx` |
| | Job performance table | `src/components/JobPerformanceTable.tsx` |
| | Job performance chart | `src/components/dashboard/JobPerformanceChart.tsx` |

---

## Implementation Plan

### Step 1: Database Migration

Create a new migration that:
1. Adds `is_hidden` boolean column to `job_listings` (default `false`)
2. Marks all existing "General Application" listings as hidden
3. Adds index for query performance

```sql
-- Add is_hidden column to job_listings table
ALTER TABLE public.job_listings 
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_is_hidden 
ON public.job_listings(is_hidden) 
WHERE is_hidden = false;

-- Mark existing General Application listings as hidden
UPDATE public.job_listings 
SET is_hidden = true 
WHERE title ILIKE 'General Application%';

-- Add comment for documentation
COMMENT ON COLUMN public.job_listings.is_hidden IS 
  'Hidden listings are active but not visible to public visitors (e.g., General Applications)';
```

### Step 2: Update Application Processor

Modify `supabase/functions/_shared/application-processor.ts` to set `is_hidden = true` when creating General Application listings:

**Line 183-189** - When creating job from job_id (keep visible):
```typescript
// No change needed - regular jobs should be visible
```

**Lines 269-281** - When creating General Application fallback:
```typescript
const insertData: Record<string, unknown> = {
  title: 'General Application',
  organization_id: organizationId,
  category_id: categories[0].id,
  status: 'active',
  is_hidden: true,  // NEW: Hide from public view
  job_summary: clientId ? 'General applications for this carrier' : 'General applications',
  user_id: userId,
};
```

### Step 3: Update Public-Facing Queries

All public queries need to add `.eq('is_hidden', false)` or `.neq('is_hidden', true)`:

#### Frontend Hooks (4 files)

**`src/hooks/usePaginatedPublicJobs.tsx` (line 45)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW: Exclude hidden listings
```

**`src/features/candidate/hooks/useJobSearch.ts` (line 52)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW
```

**`src/hooks/useJobDetails.tsx` (line 61)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW: Prevent direct access to hidden jobs
```

**`src/components/public/RelatedJobs.tsx` (lines 39 and 80)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW (add in both query locations)
```

#### Edge Functions (6 files)

**`supabase/functions/generate-sitemap/index.ts` (line 90)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW: Keep hidden jobs out of sitemap
```

**`supabase/functions/indeed-xml-feed/index.ts` (line 38)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW
```

**`supabase/functions/google-jobs-xml/index.ts` (line 52)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW
```

**`supabase/functions/universal-xml-feed/index.ts` (line 158)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW
```

**`supabase/functions/job-feed-xml/index.ts` (line 45)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW
```

**`supabase/functions/google-indexing/index.ts` (line 98)**
```typescript
.eq('status', 'active')
.eq('is_hidden', false)  // NEW: Don't submit hidden jobs to Google
```

### Step 4: Admin Visibility (Optional Enhancement)

Admin users should still be able to see and manage hidden listings. Consider:

**`src/pages/ActiveJobIds.tsx` (line 43)** - Add optional toggle:
```typescript
// Show hidden toggle for super_admins
.eq('status', 'active')
// Only filter by is_hidden if not showing all
...(showHidden ? {} : { is_hidden: false })
```

**Dashboard components** can continue showing all active jobs (including hidden) for internal analytics and application management.

### Step 5: Update TypeScript Types

The types will auto-regenerate after the migration, but ensure the new field is recognized:

```typescript
// In job_listings Row type:
is_hidden: boolean
```

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/[new].sql` | CREATE | Add is_hidden column, index, update existing data |
| `supabase/functions/_shared/application-processor.ts` | MODIFY | Set is_hidden=true for General Applications |
| `src/hooks/usePaginatedPublicJobs.tsx` | MODIFY | Add is_hidden filter |
| `src/features/candidate/hooks/useJobSearch.ts` | MODIFY | Add is_hidden filter |
| `src/hooks/useJobDetails.tsx` | MODIFY | Add is_hidden filter |
| `src/components/public/RelatedJobs.tsx` | MODIFY | Add is_hidden filter (2 locations) |
| `supabase/functions/generate-sitemap/index.ts` | MODIFY | Add is_hidden filter |
| `supabase/functions/indeed-xml-feed/index.ts` | MODIFY | Add is_hidden filter |
| `supabase/functions/google-jobs-xml/index.ts` | MODIFY | Add is_hidden filter |
| `supabase/functions/universal-xml-feed/index.ts` | MODIFY | Add is_hidden filter |
| `supabase/functions/job-feed-xml/index.ts` | MODIFY | Add is_hidden filter |
| `supabase/functions/google-indexing/index.ts` | MODIFY | Add is_hidden filter |
| `src/integrations/supabase/types.ts` | AUTO-UPDATE | TypeScript types regenerate |

---

## Behavior After Implementation

| Scenario | Before | After |
|----------|--------|-------|
| Visitor browses /jobs | Sees "General Application" listings | Only sees real job postings |
| Visitor accesses hidden job directly | Job details page loads | Returns "not found" / redirects |
| Application submitted without job_id | Creates visible General Application | Creates hidden General Application |
| Admin views job list | All jobs visible | All jobs visible (no change) |
| Sitemap generated | Includes all active jobs | Excludes hidden jobs |
| Indeed/Google feeds | Include General Applications | Only real job postings |

---

## Verification Steps

1. Run migration and verify `is_hidden` column exists
2. Confirm existing General Application listings have `is_hidden = true`
3. Submit a test application without job_id - verify new General Application has `is_hidden = true`
4. Browse public job board - verify no "General Application" listings appear
5. Check sitemap XML - confirm hidden jobs excluded
6. Verify admin dashboard still shows all jobs including hidden ones
