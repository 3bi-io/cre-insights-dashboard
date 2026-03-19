

# Update Existing Application + Re-sync to ATS on Full Application Completion

## Problem
When a driver completes the short application, it gets inserted into the database and auto-posted to Tenstreet/DriverReach. When they then complete the full detailed application, it creates a **second, separate** application record and posts again — resulting in duplicates in both the database and the ATS.

## Solution
Thread the `applicationId` from the short form submission all the way through to the detailed form. When the detailed form submits, it sends an **update** to the existing application instead of creating a new one, then re-triggers `autoPostToATS` with the enriched data.

## Changes

### 1. Pass `applicationId` through the flow
- **`src/hooks/useApplicationForm.ts`**: Include `applicationId` from the submit response in the route state when navigating to `/thank-you`
- **`src/pages/ThankYou.tsx`**: Add `applicationId` to `ThankYouState` and pass it along in the prefill data when navigating to `/apply/detailed`
- **`src/hooks/useDetailedApplicationForm.ts`**: Read `applicationId` from route state prefill data and include it in the submission payload as `existing_application_id`

### 2. Add update mode to `submit-application` edge function
- **`supabase/functions/submit-application/index.ts`**: 
  - Accept an optional `existing_application_id` field in the request body (add to Zod schema)
  - When present: **update** the existing application record instead of inserting a new one
  - Skip duplicate checks, confirmation emails, and source detection for updates
  - Still call `autoPostToATS` after the update to re-sync enriched data to the ATS
  - Validate that the existing application exists and matches on email/phone to prevent abuse

### 3. Update the auto-post engine behavior
- No changes needed to `auto-post-engine.ts` — it already accepts an `applicationId` and sends whatever data is current. The re-post will contain all the enriched fields (work history, medical, background, etc.)

## Data Flow

```text
Short Apply → submit-application (INSERT) → autoPostToATS (basic data)
    ↓
Thank You page (carries applicationId + formData)
    ↓
Detailed Apply (pre-filled, carries applicationId)
    ↓
submit-application (UPDATE existing) → autoPostToATS (full enriched data)
```

## Files to Edit
1. `src/hooks/useApplicationForm.ts` — pass `applicationId` to thank-you state
2. `src/pages/ThankYou.tsx` — thread `applicationId` through to detailed form
3. `src/hooks/useDetailedApplicationForm.ts` — send `existing_application_id` in payload
4. `supabase/functions/submit-application/index.ts` — add update mode with re-sync

## Security
- The update mode validates that the email/phone on the existing application matches the submission to prevent unauthorized updates
- No auth required (applicants are anonymous), but the match check prevents tampering

