

## Update Email Logo URL in Resend Templates

### Problem

All Resend email templates currently reference `https://ats-me.lovable.app/logo.png` as the logo, which may not be rendering correctly. The correct app logo asset is hosted at:

```
https://ats.me/assets/logo-icon-BEFigvat.png
```

### Fix

**Single file change:** `supabase/functions/_shared/email-config.ts` (line 40)

Update the `logo` property in `EMAIL_CONFIG.brand` from:
```
"https://ats-me.lovable.app/logo.png"
```
to:
```
"https://ats.me/assets/logo-icon-BEFigvat.png"
```

### Impact

This single change propagates to all email templates automatically since they all use `EMAIL_CONFIG.brand.logo` via the shared `getEmailHeader()` and `getEmailLogo()` helpers:

- Welcome emails (`send-welcome-email`)
- Invite emails (`send-invite-email`)
- Application confirmation emails (`send-application-email`)
- Auth email hook templates (`auth-email-templates`)
- Screening request emails (`send-screening-request`)
- Test emails (`send-test-emails`)

### Deployment

All edge functions that import from `_shared/email-config.ts` will need to be redeployed to pick up the change.

