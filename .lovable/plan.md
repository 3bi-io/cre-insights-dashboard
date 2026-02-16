

# Comprehensive Platform Review and Refactoring Plan

## Status: Phase 3 Complete ✅

---

## CRITICAL: Broken Infrastructure — ✅ Fixed (Phase 1)

### 1. Cron Job #3 (process-outbound-call-queue) — ⚠️ Manual SQL Required
Edge function updated with scheduled-to-queued promotion logic. Cron job SQL fix must be run manually in Supabase SQL Editor (table owned by supabase_admin).

### 2. Meta Leads Cron Job Missing Auth Header — ⚠️ Manual SQL Required
Same ownership restriction. SQL provided for manual execution.

---

## HIGH PRIORITY: Functional Gaps — ✅ Fixed (Phase 2)

### 3. Outbound Call Pipeline — ✅ 
Edge function now promotes `scheduled` calls to `queued` when `scheduled_at <= now()`.

### 4. Candidate Portal Messages Page — ✅ Fixed (Phase 3)
Removed placeholder page. Navigation now points to Notifications. `/my-jobs/messages` redirects to `/my-jobs/notifications`.

### 5. DashboardLayout Tab Routing — ✅ Fixed (Phase 2)
Consolidated to use `dashboardConfig.tsx` tab system exclusively.

### 6. RegularUserDashboard Quick Actions — ✅ Fixed (Phase 2)
Quick actions now link to user-accessible dashboard tabs, not admin pages.

---

## MEDIUM PRIORITY — Partially Complete

### 7. Unused Hook Calls — ✅ Fixed (Phase 2)
Removed unused `useAIProviders()` and `useAIConnectionManager()` from AIToolsPage.

### 8. Navigation Config Role Guards — Verified
ProtectedRoute handles auth-level gating. Navigation config handles visibility with role hierarchy.

### 9. `has_role` DB Function — ⚠️ Known limitation
Super admins with `organization_id = NULL` may not match via `has_role('admin')`. Mitigated by `is_super_admin()` having a separate path.

### 10. Screening/BGC Feature UI — Verified
Nav config includes `/admin/settings?tab=verifications` for admin users.

---

## PHASE 3: Polish and Consistency — ✅ Complete

### 11. Messages Page Cleanup — ✅
- Removed `MessagesPage.tsx` placeholder
- Updated `candidateNavigation` to show Notifications instead of Messages
- Added redirect from `/my-jobs/messages` → `/my-jobs/notifications`
- Updated CandidateDashboard quick stats card
- Removed Message button from ApplicationCard
- Updated SitemapPage

### 12. Error Boundaries — ✅
- Added `ErrorBoundary` wrapper around `<Outlet>` in both `CandidateLayout` and admin `Layout`
- App-level `GlobalErrorBoundary` already existed

### 13. Candidate Portal Verification — ✅
- NotificationsPage: Functional with save/load preferences
- SavedJobsPage: Functional with sorting and expired job detection
- AccountSettings: Functional with password change and privacy settings

---

## Remaining Manual Actions

Run these in Supabase SQL Editor:

**Cron #3 (Outbound Call Queue):**
```sql
SELECT cron.alter_job(
  3,
  command := $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-outbound-call',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
    ),
    body := '{"process_queue": true, "limit": 10}'::jsonb
  ) AS request_id;
  $$
);
```

**Cron #8 (Meta Leads):**
```sql
SELECT cron.alter_job(
  8,
  command := $$
  SELECT net.http_post(
    url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/meta-leads-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
