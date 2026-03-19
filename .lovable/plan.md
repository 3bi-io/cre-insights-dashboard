

# SMS Template Personalization Refactor

## Status: ✅ IMPLEMENTED

## Overview
All SMS templates now include personalized applicant first name, job title, and company name for a best-in-class mobile experience. Data is stored on the `sms_verification_sessions` table at creation time to avoid extra lookups in the webhook handler.

## Changes Made

### Database
- Added `applicant_first_name` and `job_title` columns to `sms_verification_sessions`

### Edge Functions
1. **`elevenlabs-outbound-call/index.ts`** — Fetches job title, stores `applicant_first_name` + `job_title` on session insert, refined outbound SMS with bullet formatting and STOP disclosure
2. **`sms-webhook/index.ts`** — All 4 reply templates personalized with first name, job title, and company name

### Template Examples
- **Outbound**: "Hi {firstName}! We tried reaching you about your {jobTitle} application with {clientName}. • Name: ... • Location: ... Reply YES/EDIT. Reply STOP to opt out."
- **YES (enriched)**: "Thanks for confirming, {firstName}! Your full {jobTitle} application with {clientName} is on file."
- **YES (link)**: "Thanks for confirming, {firstName}! Complete your {jobTitle} application with {clientName} here: {url}"
- **EDIT**: "No problem, {firstName}! Reply with corrections. We'll update your {jobTitle} application with {clientName}."
- **Free-text**: "Got it, {firstName}! We've forwarded your update to the {clientName} recruiting team."

## Twilio Webhook Setup Required
Configure the Twilio phone number's incoming message webhook URL to:
`https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/sms-webhook`
