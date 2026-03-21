

# Fix Role Change & Set cody@3bi.io to Client for Pemberton

## Problems Found

1. **`UserRoleDialog` TypeScript type** excludes `'client'` — the `UserRole` type is `'user' | 'admin' | 'super_admin' | 'moderator' | 'recruiter'`, missing `'client'`
2. **Broken upsert logic** — The unique constraint is `(user_id, role)`, so upserting with a *new* role just inserts a second row instead of replacing the old one. cody@3bi.io currently has 3 roles (admin, user, client) accumulated from repeated attempts
3. **`UserRoleEditDialog` (org-level)** has the same delete-then-insert pattern but casts role without `'client'` in the type union

## Plan

### 1. Fix `UserRoleDialog.tsx` (super admin user management)
- Add `'client'` to the `UserRole` type
- Replace the upsert-with-fallback logic with a clean **delete-all-then-insert** approach (delete all roles for the user, then insert the single new role)

### 2. Fix `UserRoleEditDialog.tsx` (org-level)
- Add `'client'` to the role cast type in the insert statement

### 3. Database cleanup for cody@3bi.io
- Migration to delete stale roles (admin, user) for cody@3bi.io, keeping only `client`
- Verify the user_client_assignment to Pemberton Truck Lines Inc already exists (confirmed — it does)

### Files

| Action | File |
|--------|------|
| Modify | `src/components/admin/UserRoleDialog.tsx` — fix type + mutation logic |
| Modify | `src/components/dashboard/organization/UserRoleEditDialog.tsx` — add client to type cast |
| Migration | Clean up cody@3bi.io roles to only `client` |

