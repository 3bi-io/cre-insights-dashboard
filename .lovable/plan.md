

## Plan: Invite Recruiters to Connect Their Calendar via Email

### Current State
- Calendar connections require the recruiter to be logged into the admin panel and click "Connect Calendar" themselves
- The OAuth flow is tied to the currently authenticated user (`verifyUser(req)` in `handleOAuthUrl`)
- There is no mechanism to send an invite link to a recruiter's email so they can self-authorize

### What We'll Build

**1. New DB table: `calendar_invitations`**
Tracks invite tokens sent to recruiter emails.
- `id` (UUID), `organization_id`, `client_id` (optional), `recruiter_email`, `invited_by` (user_id), `token` (unique, URL-safe), `status` (pending/completed/expired), `expires_at`, `created_at`
- RLS: admins can insert/view for their org; service_role full access

**2. Admin UI: "Invite Recruiter" button in `RecruiterCalendarConnect.tsx`**
- Add an "Invite by Email" button next to the existing "Connect Calendar" button
- Opens a small dialog asking for the recruiter's company email
- Calls the edge function to generate an invite token and send the email
- Shows confirmation toast with the invite status

**3. Edge function: new actions in `calendar-integration/index.ts`**
- `send_calendar_invite`: Admin-only action that creates a `calendar_invitations` row with a secure token, then sends an email via Resend with a link like `https://applyai.jobs/calendar/connect?token=<TOKEN>`
- `redeem_calendar_invite`: Public-ish action (no auth required) that validates the token, generates the Nylas OAuth URL with the invite's org/client context encoded in state, and redirects

**4. New page: `/calendar/connect` (invite landing page)**
- A simple page that reads the `?token=` param
- Shows the org name and a "Connect Your Calendar" button
- On click, calls `redeem_calendar_invite` which returns the Nylas OAuth URL
- After OAuth, the callback flow stores the connection linked to the org/client from the invite

**5. Update `handleOAuthCallback` in the edge function**
- Extend state parsing to include `invite_token`
- On successful token exchange, look up the invitation to get `organization_id`, `client_id`, and `recruiter_email`
- Create a profile for the recruiter if they don't have one (or link by email)
- Store the calendar connection with the correct org/client association
- Mark the invitation as `completed`

**6. Email template**
- Use the existing Resend integration and email config pattern (`_shared/email-config.ts`)
- Branded email with "Connect Your Calendar" CTA button linking to the invite page

### Files to Create/Update
- **New migration**: `calendar_invitations` table
- **`supabase/functions/calendar-integration/index.ts`**: Add `send_calendar_invite` and `redeem_calendar_invite` actions; update `handleOAuthCallback` for invite-based connections
- **`src/components/voice/RecruiterCalendarConnect.tsx`**: Add "Invite by Email" button + dialog
- **New file**: `src/pages/CalendarInviteConnect.tsx` — invite landing page
- **Route registration**: Add `/calendar/connect` route

### Flow

```text
Admin enters recruiter email → send_calendar_invite → email sent with link
                                                          ↓
Recruiter clicks link → /calendar/connect?token=xxx → validates token
                                                          ↓
Recruiter clicks "Connect Calendar" → Nylas OAuth → /calendar/callback
                                                          ↓
Callback exchanges code → stores connection with org/client from invite → marks invite completed
```

