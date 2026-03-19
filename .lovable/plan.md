

# SMS Template Personalization Refactor

## Problem
Current SMS templates are generic and lack key personalization. The `sms-webhook` responses don't include the applicant's first name, job title, or company name — data that's available via the session's `application_id` and `job_listing_id`. The outbound verification message is decent but reply templates are impersonal.

## Changes

### 1. Database Migration — Add `applicant_first_name` and `job_title` to `sms_verification_sessions`
Store these at session creation time so the webhook handler doesn't need extra lookups.

```sql
ALTER TABLE public.sms_verification_sessions 
  ADD COLUMN IF NOT EXISTS applicant_first_name text,
  ADD COLUMN IF NOT EXISTS job_title text;
```

### 2. Update `elevenlabs-outbound-call/index.ts` — Store new fields + refine outbound template

**Store fields on session insert** (~line 465):
- Add `applicant_first_name: firstName` and `job_title: jobTitle` (fetch job title from the already-queried `jobData`)

**Refined verification SMS template** (~line 428):
```
Hi {firstName}! We tried reaching you about your {jobTitle} application with {clientName}.

Here's what we have:
• Name: {firstName} {lastName}
• Location: {location}
• CDL: {cdlInfo}
• Experience: {experience}

Reply YES to confirm or EDIT to update.
Reply STOP to opt out.
```
- Adds job title context
- Bullet formatting for better readability on mobile
- STOP opt-out disclosure (TCPA best practice)

### 3. Update `sms-webhook/index.ts` — Personalize all reply templates

**Fetch personalization data** from session (already selected) plus a lightweight application query for first name fallback.

**Updated templates:**

| Template | Current | Proposed |
|----------|---------|----------|
| YES (enriched) | "Thanks for confirming your details! Your full application is already on file. We'll be in touch soon." | "Thanks for confirming, {firstName}! Your full {jobTitle} application with {clientName} is on file. A recruiter will be in touch soon." |
| YES (not enriched) | "Thanks for confirming! Complete your full application here:\n{url}\nReply STOP to opt out." | "Thanks for confirming, {firstName}! Complete your {jobTitle} application with {clientName} here:\n\n{url}\n\nThis link is personalized — your info will be pre-filled.\nReply STOP to opt out." |
| EDIT | "No problem! Please reply with your corrections..." | "No problem, {firstName}! Reply with your corrections (e.g. \"City: Dallas\" or \"CDL: Class A\"). We'll update your {jobTitle} application with {clientName}." |
| Free-text correction | "Thanks! We've received your update. A recruiter will review..." | "Got it, {firstName}! We've forwarded your update to the {clientName} recruiting team. They'll review it shortly." |

### 4. Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/new.sql` | Add `applicant_first_name`, `job_title` columns |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Store new fields on session insert; fetch job title; refine outbound SMS template |
| `supabase/functions/sms-webhook/index.ts` | Read new session fields; personalize all 4 reply templates |

### Technical Notes
- All templates stay under 320 characters (2 SMS segments max) for cost efficiency
- STOP disclosure added to initial outbound message per TCPA/carrier requirements
- Bullet points (`•`) render well on all mobile SMS clients
- No new secrets or external dependencies required

