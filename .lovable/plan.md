

# Post-Quick-Apply: Thank You + Continue to Full Application

## Overview
After submitting the short application (`/apply`), instead of just navigating to a static thank-you page, show a thank-you message **with a prominent option to continue filling out the full detailed application**. The detailed form will be pre-filled with data already captured from the short form.

## Changes

### 1. Update ThankYou page (`src/pages/ThankYou.tsx`)
- Add a new CTA button: "Complete Your Full Application" below the existing "what happens next" section
- Pass the short-form data through route state so it can be forwarded
- Add messaging: "While you wait for our call, you can complete your full application to speed up the process"
- The button navigates to `/apply/detailed` with the form data in route state

### 2. Pass form data to ThankYou (`src/hooks/useApplicationForm.ts`)
- Expand the `navigate('/thank-you', { state: ... })` call to include the submitted form data (firstName, lastName, email, phone, city, state, zip, cdl, cdlClass, experience, drug, consent, etc.)
- Add `formData` to the ThankYouState

### 3. Pre-fill detailed form from route state (`src/hooks/useDetailedApplicationForm.ts`)
- On mount, check for `location.state` containing quick-apply data
- Map overlapping fields: `firstName` → `firstName`, `lastName` → `lastName`, `email` → `email`, `phone` → `phone`, `zip` → `zipCode`, `cdl` → `cdlStatus`, `cdlClass` → `cdlClass`, `experience` → `experience`, `city` → `city`, `state` → `state`, `drug` → `drugTest`, `consent` → `consentToSms`
- Only pre-fill if the detailed form fields are currently empty (don't overwrite draft data)

### 4. Field mapping (short → detailed)
| Short Form | Detailed Form |
|---|---|
| firstName | firstName |
| lastName | lastName |
| email | email |
| phone | phone |
| city | city |
| state | state |
| zip | zipCode |
| cdl | cdlStatus |
| cdlClass | cdlClass |
| experience | experience |
| drug | drugTest |
| consent | consentToSms |

## Technical Details
- Route state is used (no URL params with PII)
- The detailed form hook already supports `useLocation()` — we add a `useEffect` to read and map the incoming state
- The ThankYou page button uses `navigate('/apply/detailed', { state: { prefill: formData } })`

