

# Client Portal Dashboard

## Overview
Create a client-facing dashboard where users with a new `client` role can log in and see full analytics scoped to their assigned client(s). R.E. Garrison staff, for example, would see their jobs, applications, pipeline funnel, source breakdown, SLA metrics, and ATS delivery status — the same data currently shown in the org-admin's Client Analytics Dashboard, but scoped to only their client.

## Architecture

```text
Auth Flow:
  Org admin invites client user → user signs up → gets 'client' role
  → linked to client(s) via user_client_assignments
  → on login, DashboardPage detects 'client' role → renders ClientPortalDashboard

Routing:
  /dashboard (existing) → DashboardPage detects role === 'client'
                         → renders <ClientPortalDashboard />

Data scoping:
  useClientPortalData hook → reads user_client_assignments for current user
                           → fetches analytics only for assigned client(s)
                           → reuses same queries as useClientAnalytics
```

## Database Changes

1. **Add `client` to `app_role` enum**
   ```sql
   ALTER TYPE public.app_role ADD VALUE 'client';
   ```

2. **Update `has_role` / `get_current_user_role`** — Add `client` to the role resolution chain (after `recruiter`, before default `user`).

3. **RLS policy on `user_client_assignments`** — Allow `client` role users to read their own assignments:
   ```sql
   CREATE POLICY "client_users_read_own_assignments"
   ON user_client_assignments FOR SELECT TO authenticated
   USING (user_id = auth.uid());
   ```

4. **RLS policies for client-scoped data access** — Allow `client` role users to read `clients`, `job_listings`, and `applications` rows that belong to their assigned client(s). These will use a security definer helper:
   ```sql
   CREATE FUNCTION is_assigned_to_client(_user_id uuid, _client_id uuid)
   RETURNS boolean ...
   ```

## Frontend Changes

### 1. Role hierarchy update
**File:** `src/utils/roleUtils.ts`
- Add `client: 1.5` to `ROLE_HIERARCHY` (above user/viewer, below recruiter)

### 2. Dashboard routing
**File:** `src/features/dashboard/pages/DashboardPage.tsx`
- Add check: if `userRole === 'client'` → render `<ClientPortalDashboard />`

### 3. New component: ClientPortalDashboard
**File:** `src/features/dashboard/components/ClientPortalDashboard.tsx`
- Fetches assigned client(s) via `useClientPortalData` hook
- If single client: shows full analytics dashboard (reusing `ClientAnalyticsSummary`, `ClientPipelineFunnel`, `ClientSourceBreakdown`, `ClientATSDeliveryStatus`, `ClientSLAMetrics`, `ClientTrendChart`)
- If multiple clients: shows a client selector + per-client analytics, plus a portfolio summary
- Header shows client logo + name, branded with client's identity

### 4. New hook: useClientPortalData
**File:** `src/hooks/useClientPortalData.ts`
- Queries `user_client_assignments` for `auth.uid()`
- Fetches client details (name, logo) for assigned clients
- Reuses `useClientAnalytics` logic for the selected client

### 5. Navigation update
- Client-role users see simplified nav: Dashboard only (no admin routes)
- Already handled by existing `hasRoleOrHigher` guards on admin routes

### 6. `get_current_user_role` DB function update
- Add client role detection between recruiter and default user

## Security Considerations
- Client users can only see data for clients they're assigned to via `user_client_assignments`
- No PII access (SSN, DOB, etc.) — client portal uses non-sensitive application fields only
- RLS enforced at database level, not just frontend filtering

## Summary of files

| Action | File |
|--------|------|
| Migration | Add `client` to `app_role`, RLS policies, helper function |
| Modify | `src/utils/roleUtils.ts` — add client to hierarchy |
| Modify | `src/features/dashboard/pages/DashboardPage.tsx` — route client role |
| Create | `src/features/dashboard/components/ClientPortalDashboard.tsx` |
| Create | `src/hooks/useClientPortalData.ts` |
| Modify | DB function `get_current_user_role` — add client role detection |

