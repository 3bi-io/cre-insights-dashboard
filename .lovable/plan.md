

# Logo System Refactoring: Complete Analysis & Recommendations

## Current State Analysis

### Storage Buckets
| Bucket | Purpose | Status |
|--------|---------|--------|
| `organization-logos` | Organization branding | Working |
| `client-logos` | Client/employer branding | Working |

### Upload Components (Well-Implemented)
| Component | Location | Target |
|-----------|----------|--------|
| `OrganizationLogoUpload` | `src/components/organizations/OrganizationLogoUpload.tsx` | Organizations |
| `ClientLogoUpload` | `src/features/clients/components/ClientLogoUpload.tsx` | Clients |
| `useOrganizationLogo` | `src/hooks/useOrganizationLogo.tsx` | Organizations (hook) |

### Display Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `LogoAvatar` | `src/components/ui/logo-avatar.tsx` | Consistent logo display container |
| `Brand` | `src/components/common/Brand.tsx` | Sidebar/header branding |

---

## Issues Identified

### Issue 1: Inconsistent Logo Display Patterns
Some components use `LogoAvatar` (correct), while others use raw `<img>` tags with inconsistent styling:

**Using LogoAvatar (Correct)**:
- `PublicJobCard.tsx` - Uses `LogoAvatar` with client logo
- `ClientsPage.tsx` - Uses `LogoAvatar` properly
- `ApplicationHeader.tsx` - Uses `LogoAvatar` properly
- `ClientLogoUpload.tsx` - Uses `LogoAvatar` for preview

**Using raw `<img>` (Inconsistent)**:
- `ApplicationCard.tsx` - Uses `<img>` with `job.organizations.logo_url`
- `JobCard.tsx` - Uses `<img>` with `job.organizations.logo_url`
- `VoiceAgentCard.tsx` - Uses `<img>` with `agent.organizations.logo_url`
- `ClientMetricsCard.tsx` - Uses `<img>` with `client.logo_url`
- `OrganizationSettings.tsx` - Uses `<img>` for logo preview
- `CandidateDashboard.tsx` - Uses `<img>` with `job.organizations.logo_url`
- `JobDetailPage.tsx` - Mixed (uses LogoAvatar but references organization logo)

### Issue 2: Wrong Logo Source for Public/Applicant Views
Several candidate-facing components display the **organization logo** instead of the **client logo**:

| Component | Current Source | Should Be | Privacy Risk |
|-----------|----------------|-----------|--------------|
| `ApplicationCard.tsx` | `job.organizations.logo_url` | `job.clients.logo_url` | Yes - exposes recruiter |
| `JobCard.tsx` | `job.organizations.logo_url` | `job.clients.logo_url` | Yes - exposes recruiter |
| `CandidateDashboard.tsx` | `job.organizations.logo_url` | `job.clients.logo_url` | Yes - exposes recruiter |
| `JobDetailPage.tsx` | `job.organizations.logo_url` | `job.clients.logo_url` | Yes - exposes recruiter |

### Issue 3: OrganizationSettings Uses URL Input Instead of Upload
`src/pages/settings/OrganizationSettings.tsx` still uses a plain text URL input for logo, while other parts of the app have proper upload functionality.

---

## Recommended Refactoring Plan

### Phase 1: Standardize Display Component

**Create a unified `CompanyLogo` component** that handles the fallback logic and standardizes display:

**File: `src/components/shared/CompanyLogo.tsx`**

```typescript
interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

This component:
- Wraps `LogoAvatar` internally
- Provides consistent sizing and styling
- Handles image error states
- Shows `LogoAvatarFallback` when no logo

### Phase 2: Fix Privacy-Sensitive Components

Update candidate-facing components to prioritize client logo:

| File | Change |
|------|--------|
| `src/features/candidate/components/ApplicationCard.tsx` | Use `job.clients?.logo_url` with fallback to organization |
| `src/features/candidate/components/JobCard.tsx` | Use `job.clients?.logo_url` with fallback to organization |
| `src/features/candidate/pages/CandidateDashboard.tsx` | Use client logo when available |
| `src/features/candidate/pages/JobDetailPage.tsx` | Use client logo as primary |

**Fallback Logic**:
```typescript
const logoUrl = job.clients?.logo_url || job.organizations?.logo_url;
const companyName = job.clients?.name || job.organizations?.name;
```

### Phase 3: Replace Raw `<img>` Tags

Convert all raw `<img>` logo displays to use the standardized component:

| File | Current | Replace With |
|------|---------|--------------|
| `ApplicationCard.tsx` | `<img src={job.organizations.logo_url}...` | `<CompanyLogo>` |
| `JobCard.tsx` | `<img src={job.organizations.logo_url}...` | `<CompanyLogo>` |
| `VoiceAgentCard.tsx` | `<img src={agent.organizations.logo_url}...` | `<CompanyLogo>` |
| `ClientMetricsCard.tsx` | `<img src={client.logo_url}...` | `<CompanyLogo>` |
| `CandidateDashboard.tsx` | `<img src={job.organizations.logo_url}...` | `<CompanyLogo>` |

### Phase 4: Upgrade OrganizationSettings

Replace the URL input in `OrganizationSettings.tsx` with the existing `OrganizationLogoUpload` component:

```typescript
// Before: Text input for logo_url
<Input id="logo_url" value={orgData.logo_url} ... />

// After: Proper upload component
<OrganizationLogoUpload
  organizationId={organization.id}
  organizationSlug={organization.slug}
  currentLogoUrl={organization.logo_url}
  onLogoUpdate={handleLogoUpdate}
  disabled={!isAdmin}
/>
```

### Phase 5: Export from Shared Index

Add the new component to the shared exports:

**File: `src/components/shared/index.ts`**
```typescript
export { CompanyLogo } from './CompanyLogo';
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/shared/CompanyLogo.tsx` | New unified logo display component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/shared/index.ts` | Add CompanyLogo export |
| `src/features/candidate/components/ApplicationCard.tsx` | Use CompanyLogo with client priority |
| `src/features/candidate/components/JobCard.tsx` | Use CompanyLogo with client priority |
| `src/features/candidate/pages/CandidateDashboard.tsx` | Use CompanyLogo with client priority |
| `src/features/candidate/pages/JobDetailPage.tsx` | Use CompanyLogo with client priority |
| `src/components/voice/VoiceAgentCard.tsx` | Use CompanyLogo (org context is correct here) |
| `src/features/clients/components/ClientMetricsCard.tsx` | Use CompanyLogo |
| `src/pages/settings/OrganizationSettings.tsx` | Replace URL input with OrganizationLogoUpload |

---

## Benefits

1. **Consistency**: Single component for all logo displays
2. **Privacy**: Client logos shown to applicants, not recruiting org logos
3. **Maintainability**: Centralized styling and behavior
4. **Better UX**: Proper upload UI instead of manual URL entry
5. **Error Handling**: Graceful fallbacks for missing/broken images

---

## Testing Checklist

After implementation:
- Verify CR England logo displays correctly in sidebar after upload
- Confirm `/jobs` page shows client logos (not organization logos)
- Test `/apply` flow shows client branding
- Check candidate dashboard displays client logos
- Verify admin-facing views show appropriate logos (org vs client context)
- Test OrganizationSettings logo upload/delete flow

