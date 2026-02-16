

# Comprehensive Platform Review and Refactoring Plan

## Executive Summary

After a thorough audit of all features, edge functions, cron jobs, UI components, and database infrastructure, this plan identifies critical, high-priority, and enhancement-level issues across the platform. The findings are organized by severity.

---

## CRITICAL: Broken Infrastructure (Immediate Fix Required)

### 1. Cron Job #3 (process-outbound-call-queue) is Broken
The primary cron job that processes queued outbound calls uses `current_setting('supabase.anon_key', true)` which returns `NULL` -- identical to the bug we just fixed on cron job #4. This means **no outbound calls are actually being placed**. Calls get created by the trigger with status `queued` or `scheduled`, but the cron never successfully invokes the edge function to process them.

**Fix:** Use `cron.alter_job(3, ...)` to replace the command with a hardcoded anon key, matching the pattern used by all other working cron jobs (#4-#10).

### 2. Meta Leads Cron Job Missing Auth Header
Cron job `meta-leads-sync-5min` sends the request **without an Authorization header** -- only `Content-Type` is included. This means the edge function receives unauthenticated requests which may fail or behave unexpectedly.

**Fix:** Add the Authorization Bearer header matching the pattern of all other cron jobs.

---

## HIGH PRIORITY: Functional Gaps

### 3. Outbound Call Pipeline End-to-End Verification
Even after fixing cron #3, the entire pipeline needs validation:
- Business hours gating creates `scheduled` calls -- but is there any mechanism that moves `scheduled` calls to `queued` when business hours resume? The process-queue cron only handles `queued` status.
- Need to add logic in the edge function or a separate cron to promote `scheduled` calls to `queued` when their `scheduled_at` timestamp is reached.

### 4. Candidate Portal Messages Page is Placeholder
The `/my-jobs/messages` page is a "Coming Soon" placeholder. The navigation config still links to it with a `badge: 'Soon'`. This should either be hidden from navigation or implemented.

### 5. DashboardLayout Tab Routing is Disconnected
`DashboardLayout.tsx` uses a manual `switch` statement for `?tab=` routing (features, ai, branding, users, ai-impact) but the `dashboardConfig.tsx` defines a separate `dashboardTabs` array with different tab IDs (overview, applications, clients, users, ai-impact, analytics, apply-analytics). These two systems are out of sync, meaning some tabs may not be accessible or rendered incorrectly depending on how the user navigates.

**Fix:** Consolidate to use the `dashboardConfig.tsx` tab system exclusively.

### 6. Regular User Dashboard Quick Actions Link to Admin Pages
`RegularUserDashboard.tsx` provides quick action links to `/admin/applications`, `/admin/jobs`, and `/admin/ai-analytics`. A user with `viewer` or `user` role may not have access to these admin pages, leading to permission errors or blank screens.

**Fix:** Scope quick actions to the user's actual role and available routes.

---

## MEDIUM PRIORITY: Code Quality and Consistency

### 7. Unused Imports and Hook Calls
- `AIToolsPage.tsx` initializes `useAIProviders()` and `useAIConnectionManager()` but never uses the returned values, causing unnecessary API calls on every page load.
- Several pages import components/hooks that aren't used.

### 8. Navigation Config Role Guard Inconsistencies
The navigation config uses manual boolean flags (`isSuperAdmin`, `isAdmin`, `isModerator`, `isRecruiter`) derived from `userRole`, but also accepts legacy boolean flags. The `ProtectedRoute` component should be verified to enforce the same role hierarchy at the route level, not just at the sidebar visibility level.

### 9. `has_role` DB Function Scopes to Organization
The `has_role` function checks `ur.organization_id = profiles.organization_id`. This means super_admins whose profile has `organization_id = NULL` may not match unless they also have a `user_roles` entry with `organization_id = NULL`. The `is_super_admin` function has a separate path for this, but `has_role('admin')` calls may silently fail for cross-org admin access.

### 10. Screening/BGC Feature UI is Service-Only
The `BackgroundCheckService` and hooks are well-built, but there is no dedicated UI page for managing BGC connections or viewing results. It appears to only be accessible through the application detail dialog. Consider adding a dedicated `/admin/settings?tab=verifications` page (already in the nav config but verify it renders the BGC management UI).

---

## LOWER PRIORITY: Enhancements

### 11. Candidate Portal Feature Completeness
- `NotificationsPage.tsx` -- verify it's functional (linked from Messages page)
- `AccountSettings.tsx` -- verify preferences are persisted
- `SavedJobsPage.tsx` -- verify save/unsave functionality works end-to-end
- Profile completion percentage logic is hardcoded to simple field checks

### 12. Missing Error Boundaries
Several feature pages don't have error boundaries. If a query fails, the entire page crashes instead of showing a graceful error state.

### 13. Mobile Bottom Nav vs Sidebar Consistency
The sidebar navigation and mobile bottom nav should be verified to have consistent items for each role level.

---

## Implementation Phases

### Phase 1: Critical Infrastructure (Day 1)
1. Fix cron job #3 with hardcoded anon key
2. Fix meta-leads cron to include auth header
3. Add scheduled-to-queued promotion logic for outbound calls
4. Verify end-to-end outbound call processing works

### Phase 2: Functional Fixes (Day 2-3)
5. Consolidate DashboardLayout tab routing with dashboardConfig
6. Fix RegularUserDashboard quick actions for role-appropriate links
7. Remove unused hook calls in AIToolsPage
8. Verify BGC/Verifications settings tab renders correct UI

### Phase 3: Polish and Consistency (Day 4-5)
9. Hide or implement Messages page in candidate portal
10. Audit ProtectedRoute enforcement matches navigation config
11. Add error boundaries to major feature pages
12. Verify candidate portal pages are fully functional

---

## Technical Details

### Cron Job #3 Fix SQL
```sql
SELECT cron.alter_job(
  3,
  schedule := '* * * * *',
  command := $$
    SELECT net.http_post(
      url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-outbound-call',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
      ),
      body := '{"process_queue": true, "limit": 10}'::jsonb
    ) AS request_id;
  $$
);
```

### Scheduled-to-Queued Promotion
The `process_queue` action in the edge function should be updated to also SELECT calls with `status = 'scheduled' AND scheduled_at <= now()` and flip them to `queued` before processing. Alternatively, this can be a simple DB-level UPDATE before the HTTP call.

