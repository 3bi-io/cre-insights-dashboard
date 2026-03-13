

## Fix: Calendar Invitation Email Failing to Send

### Root Cause
The `send_calendar_invite` function in `calendar-integration/index.ts` is using `noreply@applyai.jobs` as the sender address (line 463), but only `notifications.3bi.io` is verified in Resend. The logs confirm:

> "The applyai.jobs domain is not verified. Please, add and verify your domain on https://resend.com/domains"

### Fix
Change line 463 in `supabase/functions/calendar-integration/index.ts` from:
```
from: 'ApplyAI <noreply@applyai.jobs>',
```
to use the shared email config's `getSender('invites')` which resolves to `Apply AI <invites@notifications.3bi.io>` — the verified domain already used by all other email functions (e.g., `send-invite-email`).

This requires importing `getSender` from `../_shared/email-config.ts` (if not already imported) and replacing the hardcoded sender.

### Files to Update
- **`supabase/functions/calendar-integration/index.ts`** — Replace hardcoded `from` address with `getSender('invites')`, adding the import if needed.

Then redeploy the edge function.

