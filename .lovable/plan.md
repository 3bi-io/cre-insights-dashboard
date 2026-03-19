

# Send All SMS Templates to Jimmy Hayes for Review

## Context
- **Recipient**: Jimmy Hayes, +12564528215
- **Job Listing**: `a3a8b6d5-7b4b-45db-a74a-d8a0ddfc35c6` — "CDL-A Solo Truck Drivers Needed" at **Danny Herman Trucking**
- **Existing application data**: Jimmy has prior apps but none for this job listing yet

## Approach
Create a one-off edge function script (or use `supabase--curl_edge_functions` against an existing function) to systematically send all 5 SMS templates to Jimmy's phone with a short delay between each, using the real Twilio credentials already configured in Supabase.

However, since Twilio secrets (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) are not in the Lovable secrets list (they're likely set directly in Supabase edge function secrets), the cleanest approach is:

### Create a temporary edge function: `sms-template-preview`

This function will:
1. Accept a POST with `{ phone, firstName, lastName, jobTitle, clientName, jobListingId, applicationId }`
2. Send all 5 templates sequentially with 3-second delays between each
3. Prefix each message with a label like `[Template 1/5 - Verification]`

### Templates to send (using Jimmy's real data):

| # | Template | Personalized Message |
|---|----------|---------------------|
| 1 | **Initial Verification** | "Hi Jimmy! We tried reaching you about your CDL-A Solo Truck Drivers Needed application with Danny Herman Trucking.\n\nHere's what we have:\n• Name: Jimmy Hayes\n• Location: Anniston, AL\n• CDL: Yes\n• Experience: More than 3 months\n\nReply YES to confirm or EDIT to update.\nReply STOP to opt out." |
| 2 | **YES — Not Enriched** | "Thanks for confirming, Jimmy! Complete your CDL-A Solo Truck Drivers Needed application with Danny Herman Trucking here:\n\n{url}\n\nYour info will be pre-filled.\nReply STOP to opt out." |
| 3 | **YES — Already Enriched** | "Thanks for confirming, Jimmy! Your full CDL-A Solo Truck Drivers Needed application with Danny Herman Trucking is on file. A recruiter will be in touch soon." |
| 4 | **EDIT Response** | "No problem, Jimmy! Reply with your corrections (e.g. \"City: Dallas\" or \"CDL: Class A\"). We'll update your CDL-A Solo Truck Drivers Needed application with Danny Herman Trucking." |
| 5 | **Free-text Correction Ack** | "Got it, Jimmy! We've forwarded your update to the Danny Herman Trucking recruiting team. They'll review it shortly." |

### Steps
1. Create `supabase/functions/sms-template-preview/index.ts` — sends all 5 templates with labels and delays
2. Deploy and invoke it once with Jimmy's data
3. Delete the function after send (cleanup)

### Pre-requisite Check
Twilio secrets must be available to edge functions. They're not in the Lovable secrets list — need to verify they exist in Supabase function secrets before proceeding.

### Files
| File | Action |
|------|--------|
| `supabase/functions/sms-template-preview/index.ts` | Create (temporary) |

