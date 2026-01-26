

# Navigation Menus & Role Visibility Audit + Refactoring Plan

## Executive Summary

This audit reviews all navigation menus across the platform for all device types (mobile, tablet, desktop) and user roles (super_admin, admin, moderator, recruiter, viewer/user). Several inconsistencies, gaps, and opportunities for mobile-first improvements have been identified.

---

## Current Architecture Overview

### User Types & Navigation Contexts

| User Type | Primary Layout | Navigation System |
|-----------|----------------|-------------------|
| **Public Visitor** | `PublicLayout` | Header nav + mobile hamburger menu |
| **Candidate (Job Seeker)** | `CandidateLayout` | Desktop sidebar + mobile bottom nav (5 items) |
| **Organization Staff** | `Layout` | Desktop sidebar + mobile bottom nav (3 primary + "More" sheet) |

### Role Hierarchy

Database: `user < recruiter < moderator < admin < super_admin`

---

## Issues Identified

### Issue 1: Inconsistent Role Display Names

**Location**: `src/utils/navigationUtils.ts:96-108`

```text
Current getRoleDisplayName() handles:
- super_admin -> "Super Admin"
- admin -> "Admin"
- moderator -> "Moderator"
- candidate -> "Candidate"
- default -> "User"

Missing:
- recruiter -> should show "Recruiter"
- viewer -> should show "Viewer" (if used)
```

**Impact**: Users with `recruiter` role see "User" instead of their proper role name in headers and badges.

---

### Issue 2: Backend Role Hierarchy Mismatch

**Location**: `supabase/functions/_shared/serverAuth.ts:137-142`

```typescript
// Current (missing recruiter)
const roleHierarchy: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  moderator: 2,
  user: 1,
};
```

**Database hierarchy** (correct):
```sql
ARRAY['user', 'recruiter', 'moderator', 'admin', 'super_admin']
```

**Impact**: Edge functions don't properly recognize recruiter role in hierarchy checks.

---

### Issue 3: Navigation Config Missing Recruiter/Viewer Handling

**Location**: `src/config/navigationConfig.ts:113-217`

Current `getNavigationGroups()` only accepts:
- `isSuperAdmin: boolean`
- `isAdmin: boolean`

Missing checks for:
- `isModerator`
- `isRecruiter`

**Impact**: Moderators and recruiters see the same navigation as base users, even though they should have access to some admin features.

---

### Issue 4: Mobile Header Missing Organization Context

**Location**: `src/components/MobileHeader.tsx:82-95`

The desktop header shows the organization name, but the mobile header only shows the user's email and role badge.

**Impact**: On mobile, users lose visibility into which organization they're working in.

---

### Issue 5: Settings Security Page Not Linked in Navigation

**Current route**: `/admin/settings/security`

This page exists in routes (`AppRoutes.tsx:285`) but is not accessible from the main Settings tabs (`Settings.tsx`). The Settings page has 8 tabs but Security is a separate route.

**Impact**: Users must navigate directly via URL or through the sidebar dropdown; no clear path in the Settings UI.

---

### Issue 6: Candidate Portal Missing "Settings" in Mobile Nav

**Location**: `src/features/candidate/components/CandidateLayout.tsx:211`

Mobile nav shows only first 5 items from `candidateNavigation`:
1. Dashboard
2. Applications
3. Search Jobs
4. Saved Jobs
5. Profile

Missing from mobile (in desktop sidebar only):
- Messages (has "Soon" badge)
- Settings link
- Notifications link

**Impact**: Candidates can't access settings/notifications from mobile bottom nav.

---

### Issue 7: RoleGuard Uses Exact Match Instead of Hierarchy

**Location**: `src/features/shared/components/RoleGuard.tsx:49-50`

```typescript
const hasAccess = userRole && requiredRoles.includes(userRole as UserRole);
```

This checks for **exact match**, not hierarchy. So if a page requires `admin`, a `super_admin` would need to be explicitly listed.

**Workaround in use**: Pages list `['admin', 'super_admin']` as arrays.

**Recommendation**: Add `hasRoleOrHigher()` utility to frontend for cleaner hierarchy checks.

---

## Refactoring Plan

### Phase 1: Fix Role Display Names (Quick Win)

**File**: `src/utils/navigationUtils.ts`

Add missing role display names:

```typescript
export function getRoleDisplayName(role: string | null): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
    case 'recruiter':
      return 'Recruiter';
    case 'viewer':
    case 'user':
      return 'Viewer';
    case 'candidate':
      return 'Candidate';
    default:
      return 'User';
  }
}
```

Also add matching badge colors for recruiter/viewer.

---

### Phase 2: Add Frontend Role Hierarchy Utility

**New file**: `src/utils/roleUtils.ts`

```typescript
const ROLE_HIERARCHY = {
  user: 1,
  viewer: 1,
  recruiter: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5,
} as const;

export function hasRoleOrHigher(
  userRole: string | null,
  requiredRole: string
): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export function getEffectiveRoleName(role: string | null): string {
  // Normalize viewer -> user for legacy compatibility
  if (role === 'viewer') return 'user';
  return role ?? 'user';
}
```

---

### Phase 3: Extend Navigation Config for All Roles

**File**: `src/config/navigationConfig.ts`

Update `getNavigationGroups()` signature:

```typescript
export const getNavigationGroups = (options: {
  userRole: string | null;
  hasVoiceAgent: boolean;
  hasTenstreetAccess: boolean;
  organizationSlug?: string;
  tenstreetNotificationCount?: number;
}): NavGroup[] => {
  const { userRole, hasVoiceAgent, hasTenstreetAccess, ... } = options;
  
  // Role checks using hierarchy
  const isSuperAdmin = userRole === 'super_admin';
  const isAdminOrHigher = hasRoleOrHigher(userRole, 'admin');
  const isModeratorOrHigher = hasRoleOrHigher(userRole, 'moderator');
  const isRecruiterOrHigher = hasRoleOrHigher(userRole, 'recruiter');
  
  // Build navigation based on hierarchy...
}
```

This ensures:
- Super admins see everything
- Admins see admin-level and below
- Moderators see moderator-level features
- Recruiters see recruitment features
- Viewers see read-only features

---

### Phase 4: Add Security Tab to Settings Page

**File**: `src/pages/Settings.tsx`

Add Security as a tab instead of a separate route:

```typescript
const validTabs = ['profile', 'security', 'integrations', ...];

// Add Security tab trigger
<TabsTrigger value="security">Security</TabsTrigger>

// Add Security tab content
<TabsContent value="security">
  <SecuritySettingsTab />
</TabsContent>
```

Create `SecuritySettingsTab.tsx` that imports the content from `SecuritySettings.tsx`.

---

### Phase 5: Improve Mobile Header with Organization Context

**File**: `src/components/MobileHeader.tsx`

Add organization name display:

```typescript
// After brand logo
{organization && (
  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
    {organization.name}
  </span>
)}
```

---

### Phase 6: Enhance Candidate Mobile Navigation

**File**: `src/features/candidate/components/CandidateLayout.tsx`

Option A: Add Settings icon as 5th item (replacing Messages which is "Soon")
Option B: Add a "More" sheet pattern similar to admin mobile nav

Recommended: Option A for simplicity

```typescript
// Update candidateNavigation order or create mobile-specific array
const mobileNavItems = [
  candidateNavigation[0], // Dashboard
  candidateNavigation[1], // Applications
  candidateNavigation[2], // Search
  candidateNavigation[3], // Saved
  { name: 'Settings', href: '/my-jobs/settings', icon: Settings }
];
```

---

### Phase 7: Fix Backend Role Hierarchy

**File**: `supabase/functions/_shared/serverAuth.ts`

Update to include recruiter:

```typescript
const roleHierarchy: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  moderator: 3,
  recruiter: 2,
  user: 1,
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/utils/navigationUtils.ts` | Add recruiter/viewer display names and badge colors |
| `src/utils/roleUtils.ts` (new) | Create frontend role hierarchy utility |
| `src/config/navigationConfig.ts` | Extend role checking to support full hierarchy |
| `src/components/MobileHeader.tsx` | Add organization name display |
| `src/components/AppSidebar.tsx` | Update to use new role hierarchy |
| `src/components/MobileBottomNav.tsx` | Update to use new role hierarchy |
| `src/pages/Settings.tsx` | Add Security tab |
| `src/components/settings/SecuritySettingsTab.tsx` (new) | Wrapper for security settings content |
| `src/features/candidate/components/CandidateLayout.tsx` | Add Settings to mobile nav |
| `supabase/functions/_shared/serverAuth.ts` | Add recruiter to role hierarchy |

---

## Expected Results After Implementation

| User Role | Desktop Sidebar | Mobile Bottom Nav | Mobile More Sheet |
|-----------|-----------------|-------------------|-------------------|
| **Super Admin** | All groups + Administration | Dashboard, Apps, Jobs, More | Full menu |
| **Admin** | All groups except Administration | Dashboard, Apps, Jobs, More | Full except Administration |
| **Moderator** | Recruitment, Campaigns, AI, limited Settings | Dashboard, Apps, Jobs, More | Limited features |
| **Recruiter** | Recruitment, limited Campaigns | Dashboard, Apps, Jobs, More | Recruitment-focused |
| **Viewer/User** | Dashboard, read-only views | Dashboard, Apps, Jobs, More | Read-only items |

---

## Accessibility Improvements Included

1. All navigation items maintain proper `aria-current="page"` for screen readers
2. Mobile "More" sheet has proper role="menu" and aria-labels
3. Skip links already implemented on all layouts
4. Focus management on route changes preserved

---

## Testing Checklist

After implementation, verify:
- [ ] Super admin sees all navigation items on desktop and mobile
- [ ] Admin sees appropriate admin-level items
- [ ] Moderator sees moderator-appropriate features
- [ ] Recruiter sees recruitment-focused navigation
- [ ] Viewer sees read-only appropriate items
- [ ] Candidate portal shows Settings in mobile nav
- [ ] Mobile header shows organization name
- [ ] Security settings accessible from Settings tabs
- [ ] Role badges display correct names for all roles

