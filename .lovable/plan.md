
# Send Welcome Emails to CR England Users

## Current Situation

The `send-welcome-email` edge function requires JWT authentication (`verify_jwt = true`), and while you're logged into the application, the edge function testing tool I'm using doesn't have access to your session token.

**Good news**: The BCC to `c@3bi.io` is already configured in the shared email configuration (line 30-31 of `email-config.ts`), so all welcome emails will automatically be copied to that address.

## Solution: Create Admin Email Utility Component

I'll add a simple admin utility in the Super Admin dashboard that allows you to send welcome emails directly from the UI while authenticated.

### Implementation

**1. Create Admin Email Utility Component**

File: `src/features/admin/components/AdminEmailUtility.tsx`

```typescript
// A simple dialog allowing super admins to send welcome emails
// - Email input field
// - User name input field  
// - Organization selector (pre-populated from existing orgs)
// - Send button that invokes the edge function with your JWT
```

**2. Add to Super Admin Dashboard**

Update the Settings tab to include a "Send Welcome Email" action button that opens the utility dialog.

### Technical Details

- Uses your existing authenticated session via `supabase.functions.invoke()`
- Validates email format before sending
- Shows success/error toast notifications
- Pre-populates "CR England" as the organization option

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/features/admin/components/AdminEmailUtility.tsx` | Create - Email sending dialog |
| `src/features/dashboard/components/tabs/SettingsTab.tsx` | Modify - Add utility trigger |

### Alternative: Quick Script Approach

If you prefer not to add UI, I can create a one-time admin script edge function that:
1. Has `verify_jwt = false` but validates service role key
2. Accepts an array of recipients
3. Sends the welcome emails with proper BCC
4. Self-documents for audit purposes

This would be a quick way to send these two specific emails without UI changes.

## Recommended Approach

**Option A (Recommended)**: Add the Admin Email Utility to the dashboard - reusable for future needs

**Option B (Quick)**: Create a one-time admin script function specifically for this task

Both approaches will send formal welcome emails to:
- Wayne.Cederholm@crengland.com (Wayne Cederholm)
- ken.munck@crengland.com (Ken Munck)

With organization: **CR England**
BCC: **c@3bi.io** (already configured)
