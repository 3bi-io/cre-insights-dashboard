
# Add Password Reset Email Capabilities to Admin Email Utility

## Overview

Extend the existing `AdminEmailUtility` component to support both welcome emails and password reset emails. This will allow super administrators to trigger password reset emails to users directly from the dashboard, using Supabase's built-in `auth.resetPasswordForEmail()` method which sends branded emails via the existing `auth-email-templates` hook.

---

## Current Architecture

The platform has two password reset mechanisms:
1. **User-initiated**: Via `supabase.auth.resetPasswordForEmail()` which triggers the `auth-email-templates` Edge Function for branded emails
2. **Admin direct update**: Via `admin-update-password` Edge Function that directly changes the password (no email sent)

The new feature will add a third option:
3. **Admin-triggered password reset email**: Super admins can send reset instructions to users via the UI

---

## Implementation Plan

### Phase 1: Extend AdminEmailUtility Component

**File: `src/features/admin/components/AdminEmailUtility.tsx`**

Add a toggle or tabs to switch between:
- **Welcome Email** (existing functionality)
- **Password Reset Email** (new functionality)

Changes:
- Add `emailType` state: `'welcome' | 'password_reset'`
- Add tab/toggle UI to switch between email types
- Modify form to show appropriate fields based on email type
- Add new `handleSendPasswordReset()` function that uses `supabase.auth.resetPasswordForEmail()`

```typescript
// New state
const [emailType, setEmailType] = useState<'welcome' | 'password_reset'>('welcome');

// New handler for password reset
const handleSendPasswordReset = async () => {
  const validRecipients = recipients.filter(r => validateEmail(r.email));
  
  for (const recipient of validRecipients) {
    await supabase.auth.resetPasswordForEmail(recipient.email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
  }
};
```

### Phase 2: Update UI Layout

**Component Changes:**

1. Add `Tabs` component at the top of the dialog to switch between:
   - "Welcome Email" tab
   - "Password Reset" tab

2. Conditionally render form fields:
   - **Welcome Email**: Shows organization name + recipients (email + name)
   - **Password Reset**: Shows only recipients (email only, name not needed)

3. Update description text based on selected type:
   - Welcome: "Send formal welcome emails to new users"
   - Password Reset: "Send password reset instructions to users"

4. Change button text:
   - Welcome: "Send Welcome Email(s)"
   - Password Reset: "Send Reset Email(s)"

### Phase 3: Update SettingsTab Description

**File: `src/features/dashboard/components/tabs/SettingsTab.tsx`**

Update the Email Utilities card description to reflect both capabilities:

```typescript
<p className="text-sm text-muted-foreground mb-4">
  Send welcome emails and password reset instructions to users. 
  All emails are automatically BCC'd for review.
</p>
```

---

## Technical Details

### Password Reset Flow

When the admin triggers a password reset:
1. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
2. Supabase Auth generates a secure token and fires the `auth-email-templates` webhook
3. The Edge Function generates a branded password reset email with:
   - Custom styling matching the ATS.me brand
   - 24-hour expiration notice
   - Security messaging
4. Email is sent via Resend with automatic BCC to `c@3bi.io` and `codyforbes@gmail.com`

### BCC Handling

Password reset emails sent via `auth.resetPasswordForEmail()` go through the `auth-email-templates` Edge Function, which already uses `getReviewBcc()` to add the configured BCC addresses.

### Security

- Only super_admin and admin roles can access this utility (inherited from dashboard access control)
- Uses Supabase's built-in token generation (cryptographically secure)
- Tokens expire in 24 hours (Supabase default)
- All emails logged for audit purposes

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/admin/components/AdminEmailUtility.tsx` | Add email type toggle, password reset handler, update UI |
| `src/features/dashboard/components/tabs/SettingsTab.tsx` | Update description text |

---

## UI Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│  Send System Emails                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Welcome Email   │  │ Password Reset  │  ← Tabs          │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  [If Welcome Email selected]                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Organization Name                                      │ │
│  │ ┌─────────────────────────────────────────────────┐   │ │
│  │ │ CR England                                       │   │ │
│  │ └─────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Recipients                                                 │
│  ┌─────────────────────────────────────────────────────────┐
│  │ email@example.com                                [x]   │
│  │ User Name (optional)                                   │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  [+ Add Recipient]                                         │
│                                                             │
│  ┌──────────┐  ┌───────────────────┐                       │
│  │  Cancel  │  │  Send Email(s)    │                       │
│  └──────────┘  └───────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

1. Super admins can switch between welcome email and password reset modes
2. Password reset emails are sent using Supabase's secure token generation
3. All emails use the branded `auth-email-templates` system
4. BCC addresses are automatically included for oversight
5. Toast notifications confirm success/failure for each recipient
