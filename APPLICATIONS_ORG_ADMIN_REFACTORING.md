# Applications Page - Organizational Admin Refactoring

## Overview
Refactored the `/applications` page to properly support organizational administrators with automatic organization scoping and appropriate permissions.

## Changes Made

### 1. Organization-Scoped Filtering
**File**: `src/features/applications/pages/ApplicationsPage.tsx`

- Added `isOrgAdmin` flag to distinguish org admins from super admins
- Updated `useApplications` hook to automatically handle organization filtering:
  - Org admins rely on RLS policies when no explicit org filter is set
  - Super admins can filter by specific organizations
  - Regular users see only their own applications (via RLS)

```typescript
const isOrgAdmin = userRole === 'admin' && !isSuperAdmin;

const { applications, ... } = useApplications({
  enabled: true,
  filters: {
    search: searchTerm,
    organization_id: isOrgAdmin && organizationFilter === 'all' 
      ? undefined // Let RLS handle it for org admins
      : organizationFilter !== 'all' 
        ? organizationFilter 
        : undefined,
  }
});
```

### 2. Contextual UI Updates
- **Page Description**: Updates dynamically based on user role
  - Org admins: "Manage job applications for your organization"
  - Others: "Track and manage job applications"
- **Organization Filter**: Only visible to super admins (already implemented)
- **Debug Logging**: Added `isOrgAdmin` flag to debug output

### 3. Security Model
The refactoring maintains the existing RLS-based security:
- **Super Admins**: Can view all applications across all organizations
- **Org Admins**: Can view/manage applications only for their organization (enforced by RLS)
- **Recruiters**: Can view/manage assigned applications
- **Job Owners**: Can view/manage applications for their job listings

## Database RLS Policies
The following existing policies ensure proper access control:

```sql
-- Org admins can view applications in their org
CREATE POLICY "Org admins can view applications in their org"
ON applications FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Org admins can update basic application data
CREATE POLICY "Org admins can update basic application data"
ON applications FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);
```

## Features for Org Admins

### ✅ Enabled Features
- View all applications for jobs in their organization
- Update application status and details
- Export applications to PDF (organization-scoped)
- Filter by category and source
- Search across all applications in their org
- Assign recruiters to applications
- View application details and screening requests
- Send SMS to applicants
- Update Tenstreet integration data

### ❌ Not Available
- View applications from other organizations
- Change organization filter (not displayed)
- Access super admin features

## Testing Checklist

### Org Admin Access
- [ ] Org admin can view all applications from their organization
- [ ] Org admin cannot view applications from other organizations
- [ ] Org admin can update application statuses
- [ ] Org admin can assign recruiters
- [ ] Org admin can export PDF with correct data
- [ ] Organization filter is not visible to org admins
- [ ] Page description reflects org admin context

### Super Admin Access
- [ ] Super admin can view all applications
- [ ] Super admin can filter by organization
- [ ] Super admin retains all existing functionality

### Regular User Access
- [ ] Regular users see only applications for their job listings
- [ ] Regular users have appropriate permissions

### Data Integrity
- [ ] Applications are properly scoped by organization
- [ ] Filters work correctly with org scoping
- [ ] Search respects organization boundaries
- [ ] Statistics reflect org-scoped data

## Benefits

1. **Automatic Scoping**: Org admins automatically see only their organization's data
2. **Security**: RLS policies enforce access control at the database level
3. **User Experience**: Clear, contextual UI for different user roles
4. **Maintainability**: Centralized filtering logic
5. **Scalability**: Efficient queries with proper indexing support

## Next Steps

Consider these potential enhancements:
1. Add org-specific application analytics
2. Create organization-scoped bulk actions
3. Add org admin-specific application workflows
4. Implement organization-level application templates
5. Add organization application quotas/limits
