

# Client Access Management & Dashboard Visibility Refactor

## Issues Found

### 1. Missing "Client" Role in Invite/Role Options
`getRoleOptions()` in `src/utils/authHelpers.ts` does not include `client` as a selectable role. Super admins and org admins cannot assign the `client` role when inviting users or changing roles. The `UserManagementDialog` (org-level) also uses `InviteRole = 'user' | 'recruiter' | 'moderator' | 'admin'` which excludes `client`.

### 2. No "Client Dashboards" Nav Entry for Admins
Neither super admins nor org admins have a navigation item to preview/view client dashboards. The `ClientPortalDashboard` only renders when `userRole === 'client'`. Admins need an "as client" view or a dedicated route to browse client analytics from the admin side.

### 3. Org Admins Cannot Access User Management Page
The `/admin/user-management` page is in the "Administration" nav group which is super_admin-only. Org admins can only manage users via the `UserManagementDialog` on the Organizations page, which doesn't include client assignment. Org admins need client assignment capability within their user management flow.

### 4. UserManagementDialog Missing Client Assignment
The org-level `UserManagementDialog` lets admins invite/remove users and see roles, but has no UI for assigning users to specific clients. Only the super-admin `UserManagement` page has the `UserClientAssignmentDialog`.

### 5. Client Role Users Have No Simplified Nav
Client-role users currently fall into the full admin nav layout. They should see a minimal sidebar with just Dashboard (and potentially a support link).

---

## Plan

### Phase 1: Add "Client" Role to Role Options

**`src/utils/authHelpers.ts`** — Add `client` option between `user` and `recruiter`:
```
{ value: 'client', label: 'Client', description: 'Client portal access to view analytics for assigned clients' }
```

**`src/components/admin/UserManagementDialog.tsx`** — Update `InviteRole` type to include `'client'`.

### Phase 2: Add Client Assignment to Org-Level User Management

**`src/components/admin/UserManagementDialog.tsx`** — For each user in the list, add a "Manage Clients" button (Briefcase icon) that opens the existing `UserClientAssignmentDialog`. This gives org admins the same client assignment capability that super admins have on `/admin/user-management`.

### Phase 3: Add "Client Dashboards" Nav Item for Admins

**`src/config/navigationConfig.ts`** — Add a "Client Dashboards" item under the Recruitment group, visible to admins and super admins:
```
{ path: '/admin/client-dashboards', label: 'Client Dashboards', icon: BarChart3 }
```

**`src/components/routing/AppRoutes.tsx`** — Add route for `/admin/client-dashboards`.

**Create `src/pages/ClientDashboardsPage.tsx`** — A page that lists all clients (for the admin's org, or all for super admin) with a "View Dashboard" button per client. Clicking opens the `ClientPortalDashboard` component with the selected client pre-loaded, allowing admins to see exactly what client users see.

### Phase 4: Client-Role Nav Simplification

**`src/config/navigationConfig.ts`** — Add early return in `getNavigationGroups` for `userRole === 'client'` that returns an empty array (client users only get Dashboard from `mainNavItems`, plus a Support link).

**`src/components/AppSidebar.tsx`** — Ensure client-role users see minimal nav (Dashboard + Support only).

### Phase 5: Route Title & Config

**`src/config/navigationConfig.ts`** — Add `'/admin/client-dashboards': 'Client Dashboards'` to `routeTitles`.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/utils/authHelpers.ts` — add `client` role option |
| Modify | `src/components/admin/UserManagementDialog.tsx` — add `client` to InviteRole, add client assignment button |
| Modify | `src/config/navigationConfig.ts` — add Client Dashboards nav item, client-role nav simplification |
| Create | `src/pages/ClientDashboardsPage.tsx` — admin view for browsing client dashboards |
| Modify | `src/components/routing/AppRoutes.tsx` — add client-dashboards route |

