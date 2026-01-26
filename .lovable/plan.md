
# Update BCC Configuration for All Outbound Emails

## Objective

Ensure `c@3bi.io` receives a BCC copy of every outbound email from the ATS.me platform.

---

## Current State

The centralized email configuration at `supabase/functions/_shared/email-config.ts` defines a `reviewBcc` array that is used by all 8 email-sending edge functions:

```typescript
// Current configuration (line 28-30)
reviewBcc: [
  "codyforbes@gmail.com"
]
```

**All edge functions correctly use the `getReviewBcc()` helper**, meaning a single change to the config will propagate to all emails.

---

## Implementation

### Single File Change

**File:** `supabase/functions/_shared/email-config.ts`

**Change:** Update the `reviewBcc` array to include `c@3bi.io`

```typescript
// Updated configuration
reviewBcc: [
  "codyforbes@gmail.com",
  "c@3bi.io"
]
```

---

## Email Types Affected

After this change, `c@3bi.io` will receive BCC copies of:

| Email Type | Edge Function | Description |
|------------|---------------|-------------|
| Welcome Emails | `send-welcome-email` | New user account creation |
| Magic Links | `send-magic-link` | Admin login links (single and bulk) |
| Invitations | `send-invite-email` | Team member invitations |
| Screening Requests | `send-screening-request` | Background check and drug screening |
| Application Emails | `send-application-email` | Application received, status updates, interview invitations, offers, rejections |
| Contact Forms | `contact-form` | Admin notifications from contact submissions |
| Auth Emails | `auth-email-templates` | Password reset, email verification, email change confirmation |
| Test Emails | `send-test-emails` | Development testing of all templates |

---

## Technical Details

The `getReviewBcc()` function returns a copy of the `reviewBcc` array:

```typescript
export const getReviewBcc = (): string[] => {
  return [...EMAIL_CONFIG.reviewBcc];
};
```

All email-sending functions call this when configuring Resend:

```typescript
const emailResponse = await resend.emails.send({
  from: getSender('default'),
  to: [recipient],
  bcc: getReviewBcc(),  // ← Centralized BCC list
  subject: "...",
  html: "..."
});
```

---

## Verification

After deployment, you can verify the change by:
1. Triggering the `send-test-emails` function to send test copies of all email templates
2. Confirming receipt at both `codyforbes@gmail.com` and `c@3bi.io`

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/email-config.ts` | Add `c@3bi.io` to `reviewBcc` array |

---

## Expected Outcome

- All 8 email-sending edge functions will automatically BCC `c@3bi.io` on every outbound email
- No changes required to individual edge functions
- Existing `codyforbes@gmail.com` BCC remains intact
