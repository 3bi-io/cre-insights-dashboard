
# Fix Client Logo Display Across All Views

## Problem Summary

The user correctly identified that client logos are not appearing in several views where they should. The issue stems from:

1. **Missing client data in queries**: Several hooks only fetch organization data but not client data (name, logo_url)
2. **Inconsistent fallback logic**: Some components properly fallback from `clients.logo_url` to `organizations.logo_url`, but the underlying data queries don't include client information
3. **Admin JobCard missing logo entirely**: The admin job card component (`src/components/jobs/JobCard.tsx`) doesn't display any logo at all

## Files Requiring Changes

| File | Issue | Fix |
|------|-------|-----|
| `src/features/candidate/hooks/useCandidateApplications.ts` | Missing `clients.logo_url` in query | Add `logo_url` to clients select |
| `src/features/candidate/hooks/useSavedJobs.ts` | Missing `clients` data entirely | Add clients join with name and logo_url |
| `src/features/candidate/hooks/useJobSearch.ts` | Missing `clients` data entirely | Add clients join with name and logo_url |
| `src/components/jobs/JobCard.tsx` | No logo display at all | Add CompanyLogo component with client priority |
| `src/types/common.types.ts` | JobListing.clients missing logo_url | Add logo_url to clients type |

## Technical Details

### 1. Fix useCandidateApplications.ts

**Current query (line 50)**:
```typescript
clients(name),
```

**Updated query**:
```typescript
clients(name, logo_url),
```

**Update interface (line 21-23)**:
```typescript
clients?: {
  name: string;
  logo_url?: string;
};
```

### 2. Fix useSavedJobs.ts

**Current query (lines 40-52)** - Missing clients entirely:
```typescript
job_listings!inner(
  id,
  title,
  ...
  organizations!inner(
    name,
    logo_url
  )
)
```

**Updated query**:
```typescript
job_listings!inner(
  id,
  title,
  location,
  city,
  state,
  salary_min,
  salary_max,
  clients(
    name,
    logo_url
  ),
  organizations!inner(
    name,
    logo_url
  )
)
```

**Update SavedJob interface (lines 11-23)**:
```typescript
job_listings: {
  id: string;
  title: string;
  location?: string;
  city?: string;
  state?: string;
  salary_min?: number;
  salary_max?: number;
  clients?: {
    name: string;
    logo_url?: string;
  };
  organizations: {
    name: string;
    logo_url?: string;
  };
};
```

### 3. Fix useJobSearch.ts

**Current query (lines 45-51)** - Missing clients entirely:
```typescript
organizations!inner(
  name,
  logo_url
)
```

**Updated query**:
```typescript
clients(
  name,
  logo_url
),
organizations!inner(
  name,
  logo_url
)
```

### 4. Update Admin JobCard.tsx

Add logo display using the CompanyLogo component with client priority:

**Import**:
```typescript
import { CompanyLogo } from '@/components/shared';
```

**Add logo in CardHeader (after line 55)**:
```typescript
<div className="flex items-center gap-3">
  <CompanyLogo
    logoUrl={job.clients?.logo_url}
    companyName={job.clients?.name || 'Client'}
    size="sm"
  />
  <CardTitle className="text-lg leading-tight break-words">{displayTitle}</CardTitle>
</div>
```

### 5. Update common.types.ts

**Update JobListing.clients type (lines 135-137)**:
```typescript
clients?: {
  name: string;
  logo_url?: string;
};
```

## Data Flow After Fix

```text
Database (job_listings)
    │
    ├── client_id ──► clients table ──► { name, logo_url }
    │
    └── organization_id ──► organizations table ──► { name, logo_url }
    
    
Component Display Priority:
    1. clients.logo_url (if available)
    2. organizations.logo_url (fallback for admin context)
    3. LogoAvatarFallback (Building2 icon)
```

## Views Fixed

After implementation, client logos will correctly display in:

| View | Component | Current | After |
|------|-----------|---------|-------|
| Candidate Dashboard | Recent Applications | No client logo | Client logo shown |
| Candidate Dashboard | Recommended Jobs | Already working | Confirmed working |
| Saved Jobs Page | JobCard | No client logo | Client logo shown |
| Job Search Page | JobCard | No client logo | Client logo shown |
| Applications Page | ApplicationCard | No client logo | Client logo shown |
| Admin Jobs Page | JobCard | No logo at all | Client logo shown |
| Public /jobs | PublicJobCard | Already working | Confirmed working |

## Privacy Considerations

All candidate-facing components already use the correct priority:
```typescript
logoUrl={job.clients?.logo_url || job.organizations?.logo_url}
```

This ensures:
- Client logos are shown when available (privacy-safe for candidates)
- Organization logos only shown as fallback (for jobs without assigned clients)
- Generic fallback icon for edge cases
