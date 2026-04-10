

# Add Scheduled Callbacks to Client Portal Dashboard

## Summary
Add a "Scheduled Callbacks" section to the Client Portal Dashboard so clients (like Hayes AI Recruiting) can see AI-scheduled callbacks for their drivers. This involves creating a new `ScheduledCallbacksSection` component that filters callbacks by client ID through the application/job-listing join chain.

## Current State
- `ScheduledCallbacksDashboard` exists in the ElevenLabs Admin page (admin-only, shows all callbacks for the org)
- `ClientPortalDashboard` shows voice conversations but has no callback visibility
- `scheduled_callbacks` table links to clients via: `application_id -> applications -> job_listings -> clients`
- No direct `client_id` column on `scheduled_callbacks`

## Plan

### 1. Create `ScheduledCallbacksSection` component
**File:** `src/features/dashboard/components/client-portal/ScheduledCallbacksSection.tsx`

- Accepts `clientId` prop
- Queries `scheduled_callbacks` joined through `applications -> job_listings` filtered by `client_id`
- Shows upcoming and past callbacks in a card layout similar to the existing `ScheduledCallbacksDashboard` but read-only (no cancel/status update actions for client users)
- Displays driver name, phone, scheduled time, duration, status, and booking source
- Includes upcoming count badge and a refresh button

### 2. Add section to `ClientPortalDashboard`
**File:** `src/features/dashboard/components/ClientPortalDashboard.tsx`

- Import and render `ScheduledCallbacksSection` between the Voice Conversations section and Recent Applicants section
- Pass `activeClientId` as the `clientId` prop
- Only render when `activeClientId` is available

### 3. RLS consideration
- The existing RLS policy on `scheduled_callbacks` allows SELECT for authenticated users who are the recruiter or org admins
- Client-role users may not pass the current RLS policy since it checks `recruiter_user_id = auth.uid()` or admin role
- Add an RLS policy allowing client-role users to SELECT callbacks where the linked application belongs to their assigned client

## Technical Details

**Query approach** -- use a two-step strategy:
1. First fetch `application_id`s for the client: `SELECT id FROM applications WHERE job_listing_id IN (SELECT id FROM job_listings WHERE client_id = $clientId)`
2. Then fetch callbacks matching those application IDs

Alternatively, use an RPC or a direct join if the FK path resolves. The component will include a fallback for empty states.

**New RLS policy** (migration):
```sql
CREATE POLICY "Client users can view callbacks for their applications"
  ON public.scheduled_callbacks FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      JOIN user_client_access uca ON uca.client_id = jl.client_id
      WHERE uca.user_id = auth.uid()
    )
  );
```

**Component structure**: Simplified read-only version of `ScheduledCallbacksDashboard` -- shows callback cards with time, driver info, status badges, but no admin actions (cancel, mark done, no-show).

