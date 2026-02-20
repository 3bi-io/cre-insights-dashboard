

# Comprehensive Platform Email Audit and Remediation Plan

## Audit Scope

Reviewed all 9 email-sending edge functions, the shared email config, the email unsubscribe system, and all frontend email touchpoints (newsletter, contact form, blog CTA).

---

## Current Status: What's Working Correctly

These components are fully correct and need no changes:

| Component | Status |
|-----------|--------|
| `_shared/email-config.ts` | Correct branding, logos, helpers all reference "Apply AI" |
| `send-magic-link/index.ts` | Fixed in prior refactor -- uses shared header, logo, replyTo, correct redirect URL |
| `send-application-email/index.ts` | Fixed in prior refactor -- "Company" fallback, replyTo present |
| `send-screening-request/index.ts` | Fixed in prior refactor -- shared header with logo, replyTo, shared styles |
| `send-test-emails/index.ts` | Fixed in prior refactor -- all "ATS.me" replaced with `EMAIL_CONFIG.brand.name` |
| `send-invite-email/index.ts` | Correct -- uses shared header, logo, replyTo, preheader, correct branding |
| `send-welcome-email/index.ts` | Correct -- uses shared header, logo, replyTo, preheader, correct branding |
| `contact-form/index.ts` | Correct -- uses shared styles, footer, replyTo set to submitter's email |
| `email-unsubscribe/index.ts` | Correct -- CAN-SPAM compliant, branded pages, preference management |
| Contact page frontend (`ContactPage.tsx`) | Correct -- calls edge function, Zod validation matches backend |

---

## Issues Found

### Issue 1: `auth-email-templates/index.ts` -- Missing `replyTo` (Medium)

The Supabase auth hook email handler sends signup confirmations, password resets, magic links, email change confirmations, and invites but does NOT include a `replyTo` field. Users who reply to these emails get a bounce.

**Fix:** Add `replyTo: getReplyTo('support')` to the `resend.emails.send` call. The `getReplyTo` import is already available but unused.

### Issue 2: Newsletter Signup is a No-Op (High)

Both the footer (`PublicFooter.tsx`) and blog page (`BlogPage.tsx`) have newsletter signup forms that do nothing:

- **Footer**: `handleNewsletterSubmit` just shows a toast "Thanks for subscribing!" and clears the input. The email is never stored or sent anywhere.
- **Blog page**: The subscribe form has no `onSubmit` handler at all -- clicking "Subscribe" does nothing.

Users see a success message but never receive any emails, and the email address is discarded.

**Fix:** Create a `newsletter-subscribe` edge function that stores the email in a `newsletter_subscribers` table and sends a welcome/confirmation email. Connect both frontend forms to call it.

### Issue 3: Contact Form Missing Logo in Header (Low)

The contact form admin notification email (`contact-form/index.ts`) manually builds its header div instead of using `getEmailHeader()`. This means:
- No Apply AI logo appears in the header
- The gradient style is hardcoded rather than using the shared config

This is admin-internal only, so it's low priority but inconsistent with all other emails.

**Fix:** Replace the manual header div with `getEmailHeader("New Contact Form Submission", { gradient: "#f59e0b 0%, #d97706 100%", showLogo: true, logoAlt: "Apply AI - Contact Form" })`.

### Issue 4: Contact Form Missing Preheader Text (Low)

The contact form notification email doesn't include preheader text. All other emails use `getPreheaderText()` for better email client preview.

**Fix:** Add `getPreheaderText("New contact form submission from [name] at [company]")` to the template.

---

## Implementation Plan

### Step 1: Fix auth-email-templates replyTo

**File:** `supabase/functions/auth-email-templates/index.ts`

Add `replyTo` import (already imported but unused -- `getReplyTo` is imported) and add to the send call:

```
replyTo: getReplyTo('support'),
```

This is a one-line addition at line 449 in the `resend.emails.send` call.

### Step 2: Create newsletter subscription backend

**Database:** Create a `newsletter_subscribers` table:
- `id` (uuid, primary key)
- `email` (text, unique, not null)
- `subscribed_at` (timestamptz, default now())
- `unsubscribed_at` (timestamptz, nullable)
- `source` (text -- "footer", "blog", etc.)
- RLS: allow anonymous inserts, restrict reads to admins

**New Edge Function:** `supabase/functions/newsletter-subscribe/index.ts`
- Accept `{ email, source }` POST request
- Validate email format with Zod
- Upsert into `newsletter_subscribers` (re-subscribe if previously unsubscribed)
- Send a brief welcome email via Resend confirming the subscription
- Rate limit: 5 requests per minute per IP
- `verify_jwt = false` (public endpoint)

### Step 3: Connect frontend newsletter forms

**File:** `src/components/public/PublicFooter.tsx`
- Update `handleNewsletterSubmit` to call the `newsletter-subscribe` edge function
- Show loading state during submission
- Show error message if it fails

**File:** `src/pages/public/BlogPage.tsx`
- Add state and submit handler for the blog newsletter form
- Call the same `newsletter-subscribe` edge function with `source: "blog"`

### Step 4: Fix contact form email template

**File:** `supabase/functions/contact-form/index.ts`
- Import `getEmailHeader` and `getPreheaderText` from shared config
- Replace manual header div with `getEmailHeader()` call
- Add preheader text with submitter name and company

### Step 5: Deploy and verify

Deploy all modified edge functions:
- `auth-email-templates`
- `newsletter-subscribe` (new)
- `contact-form`

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/newsletter-subscribe/index.ts` | Newsletter subscription handler |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/auth-email-templates/index.ts` | Add replyTo to email send |
| `supabase/functions/contact-form/index.ts` | Use shared header with logo, add preheader |
| `src/components/public/PublicFooter.tsx` | Wire newsletter form to edge function |
| `src/pages/public/BlogPage.tsx` | Wire blog newsletter form to edge function |
| `supabase/config.toml` | Add newsletter-subscribe function config |

## Database Migration

Create `newsletter_subscribers` table with appropriate columns and RLS policies.

