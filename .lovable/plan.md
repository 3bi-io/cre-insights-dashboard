

# Admin Functions Review and Refactoring Plan

## Executive Summary

After thorough analysis of the codebase, I've identified **several inconsistencies and gaps** in admin role handling that need to be addressed to ensure Super Admins and Organization Admins have full control over their respective domains.

## Current Architecture Overview

### Role Hierarchy (from roleUtils.ts)
```text
+------------------+-------+
| Role             | Level |
+------------------+-------+
| viewer / user    |   1   |
| recruiter        |   2   |
| moderator        |   3   |
| admin            |   4   |
| super_admin      |   5   |
+------------------+-------+
```

### Core Components
- **RoleGuard** - Protects routes based on exact role matching (not hierarchy-aware)
- **AdminPageLayout** - Wraps pages with optional role protection
- **FeatureGuard** - Controls feature access based on organization settings
- **PlatformAccessGuard** - Controls platform access per organization
- **hasRoleOrHigher()** - Hierarchy-aware role checking utility

## Identified Issues

### Issue 1: RoleGuard Uses Exact Matching, Not Hierarchy
**Location:** `src/features/shared/components/RoleGuard.tsx`

**Problem:** RoleGuard checks if `userRole` is included in `requiredRoles` array (exact match) rather than using the hierarchy-aware `hasRoleOrHigher()` utility.

```typescript
// Current behavior (line 50):
const hasAccess = userRole && requiredRoles.includes(userRole as UserRole);

// Expected behavior:
const hasAccess = requiredRoles.some(role => hasRoleOrHigher(userRole, role));
```

**Impact:** A page protected with `requiredRole="admin"` blocks `super_admin` users unless explicitly listed.

### Issue 2: Missing "recruiter" Role in UI Dialogs
**Location:** `src/components/admin/UserRoleDialog.tsx` (lines 139-144)

**Problem:** The role selector omits "recruiter" role despite it being a valid role in the hierarchy.

```typescript
// Current (missing recruiter):
<SelectItem value="user">User</SelectItem>
<SelectItem value="moderator">Moderator</SelectItem>
<SelectItem value="admin">Admin</SelectItem>
<SelectItem value="super_admin">Super Admin</SelectItem>
```

**Location:** `src/components/dashboard/organization/UserRoleEditDialog.tsx` (lines 109-113)

Same issue - missing "recruiter" role option.

### Issue 3: UserManagementDialog Limited Role Options
**Location:** `src/components/admin/UserManagementDialog.tsx` (lines 35, 184-191)

**Problem:** Only offers "user" and "admin" roles for inviting users, missing "recruiter" and "moderator".

### Issue 4: Inconsistent isOrgAdmin Definition
**Location:** Multiple files use different definitions:

```typescript
// In useAuth.tsx (line 408):
const isOrgAdmin = userRole === 'admin' && userType === 'organization';

// In AdminApplicationsPage.tsx (line 38):
const isOrgAdmin = userRole === 'admin';  // No userType check

// In ApplicationsPage.tsx (line 51):
const isOrgAdmin = userRole === 'admin' && !isSuperAdmin;
```

**Impact:** Inconsistent behavior for organization admins across pages.

### Issue 5: Dashboard Routing Lacks Fallback for Moderator/Recruiter
**Location:** `src/features/dashboard/pages/DashboardPage.tsx` (lines 37-45)

**Problem:** Dashboard routing only handles `super_admin` and `admin` explicitly. Moderators and recruiters fall through to `RegularUserDashboard` which may not give appropriate access.

```typescript
if (userRole === 'super_admin') {
  return <SuperAdminDashboard />;
}
if (userRole === 'admin') {
  return <DashboardLayout organizationName={organization?.name} />;
}
// Moderators/recruiters get RegularUserDashboard - may be too limited
return <RegularUserDashboard />;
```

### Issue 6: Super Admin Not Consistently Granted All Access
**Location:** `src/components/admin/PlatformAccessGuard.tsx`

**Good Pattern:** Super admins bypass platform access checks correctly (line 30-34).

**Location:** `src/hooks/useOrganizationFeatures.tsx`

**Good Pattern:** Super admins bypass feature checks correctly (line 47-48).

These are correctly implemented but should be verified across all guards.

### Issue 7: UserRoleEditDialog Missing Organization Context
**Location:** `src/components/dashboard/organization/UserRoleEditDialog.tsx` (lines 47-54)

**Problem:** When updating a role, it doesn't include `organization_id`, which may break organization-scoped roles.

```typescript
// Current:
.insert({
  user_id: userId,
  role: newRole as 'user' | 'admin' | 'moderator' | 'super_admin'
});

// Should include:
.insert({
  user_id: userId,
  role: newRole,
  organization_id: currentOrganization?.id
});
```

## Refactoring Plan

### Phase 1: Fix RoleGuard Hierarchy Logic
Update RoleGuard to use the hierarchy-aware utility:

**File:** `src/features/shared/components/RoleGuard.tsx`

- Import `hasRoleOrHigher` from `@/utils/roleUtils`
- Replace exact match logic with hierarchy check
- Ensure super_admin always passes any role check

### Phase 2: Standardize isOrgAdmin/isSuperAdmin Helpers
Create centralized auth helper utilities to eliminate inconsistencies:

**New File:** `src/utils/authHelpers.ts`

```typescript
export function isOrganizationAdmin(
  userRole: string | null, 
  userType: string | null
): boolean {
  return userRole === 'admin' && userType === 'organization';
}

export function canManageOrganization(
  userRole: string | null
): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

export function canManageUsers(
  userRole: string | null
): boolean {
  return hasRoleOrHigher(userRole, 'admin');
}
```

### Phase 3: Update Role Selection Dialogs
Add missing roles to all user management dialogs:

**Files to update:**
- `src/components/admin/UserRoleDialog.tsx`
- `src/components/admin/UserManagementDialog.tsx`
- `src/components/dashboard/organization/UserRoleEditDialog.tsx`

Add recruiter and moderator options with appropriate descriptions:

```typescript
const ROLE_OPTIONS = [
  { value: 'user', label: 'User', description: 'Basic access' },
  { value: 'recruiter', label: 'Recruiter', description: 'Manage applications' },
  { value: 'moderator', label: 'Moderator', description: 'Manage content' },
  { value: 'admin', label: 'Admin', description: 'Full organization access' },
  // super_admin only shown to super_admins
];
```

### Phase 4: Fix Organization Context in Role Updates
Update role dialogs to include organization_id when applicable:

**Files to update:**
- `src/components/dashboard/organization/UserRoleEditDialog.tsx`
- `src/components/admin/UserManagementDialog.tsx`

### Phase 5: Improve Dashboard Role Routing
Update DashboardPage to provide appropriate dashboards for all role levels:

**File:** `src/features/dashboard/pages/DashboardPage.tsx`

```typescript
if (userRole === 'super_admin') {
  return <SuperAdminDashboard />;
}

// Admin and moderator get full organization dashboard
if (hasRoleOrHigher(userRole, 'moderator')) {
  return <DashboardLayout organizationName={organization?.name} />;
}

// Recruiter gets limited dashboard
if (userRole === 'recruiter') {
  return <RecruiterDashboard />;
}

return <RegularUserDashboard />;
```

### Phase 6: Create Consolidated Admin Access Control
Create a centralized hook for all admin access patterns:

**New File:** `src/hooks/useAdminAccess.ts`

```typescript
export function useAdminAccess() {
  const { userRole, userType, organization } = useAuth();
  
  return {
    // Role checks
    isSuperAdmin: userRole === 'super_admin',
    isOrgAdmin: userRole === 'admin' && userType === 'organization',
    isModeratorOrHigher: hasRoleOrHigher(userRole, 'moderator'),
    isRecruiterOrHigher: hasRoleOrHigher(userRole, 'recruiter'),
    
    // Permission checks
    canManageOrganization: hasRoleOrHigher(userRole, 'admin'),
    canManageUsers: hasRoleOrHigher(userRole, 'admin'),
    canManageJobs: hasRoleOrHigher(userRole, 'recruiter'),
    canManageApplications: hasRoleOrHigher(userRole, 'recruiter'),
    canAccessAnalytics: hasRoleOrHigher(userRole, 'moderator'),
    canAccessAITools: hasRoleOrHigher(userRole, 'moderator'),
    
    // Context
    organizationId: organization?.id,
    organizationName: organization?.name,
  };
}
```

## Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `src/features/shared/components/RoleGuard.tsx` | Fix hierarchy logic | High |
| `src/utils/authHelpers.ts` | New file | High |
| `src/hooks/useAdminAccess.ts` | New file | High |
| `src/components/admin/UserRoleDialog.tsx` | Add missing roles | Medium |
| `src/components/admin/UserManagementDialog.tsx` | Add missing roles | Medium |
| `src/components/dashboard/organization/UserRoleEditDialog.tsx` | Add missing roles + org context | Medium |
| `src/features/dashboard/pages/DashboardPage.tsx` | Improve role routing | Medium |
| `src/features/applications/pages/AdminApplicationsPage.tsx` | Use centralized helpers | Low |
| `src/features/applications/pages/ApplicationsPage.tsx` | Use centralized helpers | Low |

## Implementation Order

1. Create `authHelpers.ts` with standardized role checks
2. Create `useAdminAccess.ts` hook
3. Fix RoleGuard to use hierarchy logic
4. Update role selection dialogs
5. Update DashboardPage routing
6. Migrate existing pages to use centralized helpers

## Testing Recommendations

After implementation, verify:

1. Super admin can access all pages (Organizations, User Management, etc.)
2. Org admin can manage their organization users, settings, features
3. Moderator can access Applications, Jobs, AI Tools, Ad Networks
4. Recruiter can access Applications, Jobs, Clients
5. User gets limited dashboard with read-only metrics

