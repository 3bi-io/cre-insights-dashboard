

# Update All Email Addresses to support@applyai.jobs

## Summary

Audit found **5 locations** still using old `@3bi.io` addresses for admin notifications/reply-to, plus 1 typo and 1 old recipient address. All need to point to `support@applyai.jobs`.

## Changes

### 1. `supabase/functions/_shared/email-config.ts` (central config)
Update reply-to addresses:
- `support: "support@3bi.io"` → `"support@applyai.jobs"`
- `hr: "hr@3bi.io"` → `"support@applyai.jobs"`
- `admin: "admin@3bi.io"` → `"support@applyai.jobs"`

### 2. `supabase/functions/contact-form/index.ts`
Change admin notification recipient:
- `to: ['admin@3bi.io']` → `to: ['support@applyai.jobs']`

### 3. `supabase/functions/send-welcome-email/index.ts`
Update support link in welcome email body:
- `mailto:support@3bi.io` → `mailto:support@applyai.jobs`
- Display text `support@3bi.io` → `support@applyai.jobs`

### 4. `src/pages/public/ContactPage.tsx`
Fix typo in mailto href:
- `href="mailto:sup@applyai.jobs"` → `href="mailto:support@applyai.jobs"`

### 5. Redeploy edge functions
Deploy `contact-form` and `send-welcome-email` so the changes take effect.

## Not Changed (already correct)
- `src/components/Footer.tsx` — already `support@applyai.jobs`
- `src/pages/Support.tsx` — already `support@applyai.jobs`
- `src/pages/PartnerSetupGuidePage.tsx` — already `support@applyai.jobs`
- `src/pages/ApiDocsPage.tsx` — already `support@applyai.jobs`
- ContactPage structured data — already `support@applyai.jobs`
- `c@3bi.io` references — these are super admin identity checks, not notification addresses

