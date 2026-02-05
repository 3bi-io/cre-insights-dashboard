
# Plan: Logo Display Review and Refactoring

## Overview
This plan addresses gaps in client logo display across the platform, ensuring consistent branding and optimal user experience on all pages.

## Current Status

### Pages with Correct Logo Implementation
- **Job Details Page** (`/jobs/:id`): Displays client logo prominently using `LogoAvatar`
- **Jobs Listing** (`/jobs`): Shows client logos on each `PublicJobCard`
- **Companies Page** (`/clients`): Shows logos using `ClientCard` component
- **Apply Pages** (`/apply`, `/apply/detailed`): Hero-style client logo display
- **Thank You Page**: Preserves client logo from application flow
- **Admin Client Metrics Dashboard**: Shows logos on `ClientMetricsCard`

### Issues to Fix

| Component | Location | Issue |
|-----------|----------|-------|
| `RelatedJobs` | `/jobs/:id` sidebar | Shows `Building2` icon only - doesn't fetch `logo_url` |
| `ClientsTable` | Admin clients page | No logos displayed in table or cards |
| Candidate pages | Various | Falls back to organization logo, potentially leaking recruiter branding |

## Implementation Plan

### 1. Fix RelatedJobs Component
**File:** `src/components/public/RelatedJobs.tsx`

Update the Supabase query to include `clients(name, logo_url)`:
```text
Current: clients(name)
Updated: clients(name, logo_url)
```

Update the UI to display the logo:
- Replace `Building2` icon with `CompanyLogo` component
- Use the `logo_url` from the client data

### 2. Add Logos to ClientsTable (Admin)
**File:** `src/features/clients/components/ClientsTable.tsx`

This component consolidates clients by name but doesn't display logos. Changes needed:
- Add `logo_url` to the consolidated client type
- Include `CompanyLogo` component in both mobile card and desktop table views
- Use the first logo_url found for consolidated entries

### 3. Remove Organization Logo Fallback (Privacy Fix)
**Files affected:**
- `src/features/candidate/components/JobCard.tsx`
- `src/features/candidate/pages/JobDetailPage.tsx`
- `src/features/candidate/pages/CandidateDashboard.tsx`
- `src/features/candidate/components/ApplicationCard.tsx`
- `src/features/candidate/hooks/useSavedJobs.ts`

Change pattern from:
```typescript
logoUrl={job.clients?.logo_url || job.organizations?.logo_url}
```
To:
```typescript
logoUrl={job.clients?.logo_url}
```

This ensures organization branding is never exposed to candidates.

### 4. Update useJobDetail Hook (Candidate)
**File:** `src/features/candidate/hooks/useJobDetail.ts`

Remove `organizations.logo_url` from the select query since we shouldn't expose it:
```text
Current: organizations!inner(id, name, logo_url, slug)
Updated: organizations!inner(id, name, slug)
```

Keep `clients(id, name, logo_url)` for proper client branding.

## Technical Details

### RelatedJobs Query Update
```sql
SELECT
  id, title, job_title, location, city, state,
  client_id, organization_id,
  clients(name, logo_url),  -- Add logo_url
  job_categories(name)
```

### ClientsTable Data Structure
Add to consolidated client interface:
```typescript
interface ConsolidatedClient {
  // existing fields...
  logo_url: string | null;  // First logo found for this client name
}
```

### Component Changes Summary
1. **RelatedJobs**: Add logo display with `CompanyLogo` component
2. **ClientsTable**: Add `CompanyLogo` to card header and table row
3. **Candidate pages**: Remove organization logo fallback for privacy

## Verification Steps
After implementation:
1. Navigate to `/jobs/:id` - verify the Pemberton logo appears in Related Jobs section
2. Navigate to `/admin/clients` - verify logos appear in the table
3. Test candidate portal pages - verify only client logos show (no org fallback)
4. Test apply flow - verify logo persistence through to thank-you page

## Files to Modify
1. `src/components/public/RelatedJobs.tsx`
2. `src/features/clients/components/ClientsTable.tsx`
3. `src/features/candidate/components/JobCard.tsx`
4. `src/features/candidate/pages/JobDetailPage.tsx`
5. `src/features/candidate/pages/CandidateDashboard.tsx`
6. `src/features/candidate/components/ApplicationCard.tsx`
7. `src/features/candidate/hooks/useJobDetail.ts`
