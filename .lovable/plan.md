

# Add Client Assignment for Admin Users

## Overview
Add the ability to assign admin-level users to specific clients within their organization from the User Management page. Currently, users are assigned to organizations but there is no way to associate them with specific clients. This requires a new database table and a new dialog component.

## Current State
- Users have `organization_id` on their `profiles` table
- Clients belong to organizations via `clients.organization_id`
- No user-to-client mapping exists
- The User Management page (`/admin/user-management`) has dialogs for role, organization, and password management

## Changes

### 1. Database: Create `user_client_assignments` table
A new junction table to map users to their assigned clients:

```text
user_client_assignments
  - id (uuid, PK)
  - user_id (uuid, FK -> auth.users, NOT NULL)
  - client_id (uuid, FK -> clients, NOT NULL)
  - assigned_at (timestamptz, default now())
  - assigned_by (uuid, FK -> auth.users)
  - UNIQUE(user_id, client_id)
```

RLS policies:
- Super admins can do everything
- Org admins can view/manage assignments for users in their organization
- Users can view their own assignments

### 2. New Component: `UserClientAssignmentDialog`
- Dialog triggered from the `UserActionsDropdown` for admin/moderator/recruiter users
- Shows the user's organization name and lists all clients in that org
- Checkbox-based multi-select to assign/unassign clients
- Saves assignments to `user_client_assignments`

### 3. Update `UserActionsDropdown`
- Add a new "Manage Clients" menu item with a `Briefcase` icon
- Only visible for users who have an organization assigned (since clients belong to orgs)
- Passes `onManageClients` callback

### 4. Update `UserManagement` page
- Add state for the new client assignment dialog
- Add handler and pass to `UserActionsDropdown`
- Display assigned client count in the user row (e.g., "3 clients" badge)

### 5. Update `useSuperAdminUsers` hook
- Fetch `user_client_assignments` alongside profiles and roles
- Include assigned client names/count in the returned user data

## Technical Details

### Files to create:
- `src/components/admin/UserClientAssignmentDialog.tsx` -- multi-select dialog for client assignments

### Files to modify:
- `src/components/admin/UserActionsDropdown.tsx` -- add "Manage Clients" menu item
- `src/pages/UserManagement.tsx` -- add dialog state and handler, show client count
- `src/hooks/useSuperAdminUsers.tsx` -- fetch client assignments data

### Database migration:
- Create `user_client_assignments` table with RLS policies
