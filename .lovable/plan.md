

# Update Email Logo to PNG Format

## What's Changing

All email templates currently reference the SVG logo (`logo-icon.svg`). This update switches them to the PNG version (`logo-icon.png`) for better email client compatibility — many email clients (notably Outlook) have limited or broken SVG support.

## The Fix

**One line change** in the centralized email config. Since all email templates use `getEmailHeader()` and `getEmailLogo()`, which read from `EMAIL_CONFIG.brand.logo`, updating this single value propagates the PNG logo to every email automatically.

**File:** `supabase/functions/_shared/email-config.ts` (line 40)

Change:
```
logo: "https://applyai.jobs/logo-icon.svg"
```
To:
```
logo: "https://applyai.jobs/logo-icon.png"
```

## Why Not Use the Preview URL?

The URL you shared (`id-preview--...lovable.app/assets/logo-icon-BEFigvat.png`) contains a build hash that changes on every deployment, which would break the logo in all previously sent emails. The production URL `https://applyai.jobs/logo-icon.png` is stable and permanent.

## Emails Affected

All 8 email-sending functions automatically pick up this change:
- Welcome emails
- Invite emails  
- Magic link emails
- Application confirmation emails
- Screening request emails
- Auth emails (signup, password reset, etc.)
- Newsletter welcome emails
- Contact form notifications

## Deployment

Redeploy all edge functions that send emails so they use the updated config.

## Technical Detail

No other files need changes. The `LogoIcon` React component imports from `src/assets/logo-icon.png` (a separate bundled asset for the web app UI), which is unrelated to the email logo URL.
