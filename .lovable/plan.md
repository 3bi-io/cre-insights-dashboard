

# Email Template Audit and Refactoring Plan

## Summary of Issues Found

After reviewing all 7 email-sending edge functions and the shared email config, I identified several inconsistencies that hurt the user experience and brand integrity.

---

## Issues by Category

### 1. Old Brand Name "ATS.me" Still Present (Critical)

The platform rebranded to "Apply AI" but several files still reference the old name:

- **send-magic-link/index.ts**
  - Line 146: Subject says `"Magic Link Login Access - ATS.me"`
  - Line 243: Subject says `"Administrator Magic Link Login - ATS.me"`

- **send-test-emails/index.ts** (13 occurrences)
  - Line 33: Subject `"[TEST] Welcome to ATS.me!"`
  - Line 41: Header `"Welcome to ATS.me! 🎉"`, logo alt `"ATS.me - Welcome"`
  - Line 44: Body text `"on ATS.me!"`
  - Line 65: Subject `"...on ATS.me"`
  - Line 73: Logo alt `"ATS.me - Team Invitation"`, header/body references
  - Line 76-79: Body text references "ATS.me"
  - Line 107, 137, 167, 200, 229: Logo alt text all say `"ATS.me - ..."`
  - Lines 192, 200, 203, 205: Subject and body say `"ATS.me"` / `"Sign In to ATS.me"`

### 2. Missing Logo in Headers

- **send-magic-link/index.ts** (line 46-48): Uses a manually constructed header div instead of the shared `getEmailHeader()` helper, so the Apply AI logo is NOT shown in magic link emails. All other email types display the logo.

- **send-screening-request/index.ts** (lines 110, 148, 189): Each screening type builds its own header manually instead of using `getEmailHeader()`, so logos are missing from all screening emails.

### 3. Missing replyTo on Some Emails

- **send-application-email/index.ts** (line 332): Does NOT include a `replyTo` field. Applicants who reply go nowhere instead of reaching support.
- **send-screening-request/index.ts** (line 352): No `replyTo` set for screening emails.
- **send-test-emails/index.ts** (line 274): No `replyTo` on any test emails.

### 4. Inconsistent Default Company Name Fallback

- **send-application-email/index.ts** (line 76): Falls back to `"Apply AI"` -- but this is an applicant-facing email that should show the employer (client) name. The fallback should be `"Company"` per the privacy branding rules.

### 5. send-welcome-email References Old Branding

- **send-welcome-email/index.ts** (line 73): Login link says `"applyai.jobs/auth"` as text, which is correct, but references "Apply AI" in quick start guide features which include internal platform features applicants wouldn't see. This is fine since welcome emails are admin-facing (internal users only).

### 6. send-magic-link Redirect URL Uses Dev Domain

- **send-magic-link/index.ts** (lines 127, 225): The redirect URL is constructed by replacing `supabase.co` with `lovableproject.com`, which is the preview/dev domain, not production. Magic link recipients land on the dev URL instead of `applyai.jobs`.

---

## Implementation Plan

### Step 1: Fix send-magic-link/index.ts
- Replace all "ATS.me" references with "Apply AI"
- Use `getEmailHeader()` with `showLogo: true` instead of the manual header div
- Add `replyTo: getReplyTo('support')` to email sends
- Fix redirect URL to use `EMAIL_CONFIG.brand.website` (`https://applyai.jobs`) instead of the dev domain pattern

### Step 2: Fix send-application-email/index.ts
- Change default `companyName` fallback from `"Apply AI"` to `"Company"` (line 76) to maintain employer privacy on applicant-facing emails
- Add `replyTo: getReplyTo('support')` to the email send call

### Step 3: Fix send-screening-request/index.ts
- Replace manual header divs with `getEmailHeader()` calls with `showLogo: true` for all 3 screening types (background_check, employment_application, drug_screening)
- Use shared `baseEmailStyles` and `contentStyles` from email-config instead of locally redefined copies
- Add `replyTo: getReplyTo('support')` to the email send

### Step 4: Fix send-test-emails/index.ts
- Replace all 13+ "ATS.me" references with "Apply AI"
- Update all logo alt text from "ATS.me - ..." to "Apply AI - ..."
- Update all email subjects from "[TEST] ... ATS.me" to "[TEST] ... Apply AI"

### Step 5: Verify no other files reference old branding
- Confirm `email-config.ts`, `send-invite-email`, `send-welcome-email`, `auth-email-templates`, and `contact-form` already use "Apply AI" correctly (verified -- they do)

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-magic-link/index.ts` | Fix branding, add logo, fix redirect URL, add replyTo |
| `supabase/functions/send-application-email/index.ts` | Fix company fallback, add replyTo |
| `supabase/functions/send-screening-request/index.ts` | Use shared header with logo, remove duplicate styles, add replyTo |
| `supabase/functions/send-test-emails/index.ts` | Replace all "ATS.me" with "Apply AI" (13+ occurrences) |

## Files Already Correct (No Changes Needed)

- `supabase/functions/_shared/email-config.ts`
- `supabase/functions/send-invite-email/index.ts`
- `supabase/functions/send-welcome-email/index.ts`
- `supabase/functions/auth-email-templates/index.ts`
- `supabase/functions/contact-form/index.ts`

