

## Enrich Tenstreet XML Payload: DisplayFields + CustomQuestions

### Overview

Update two files to produce the exact XML structure you specified, with auto-populated DisplayFields and CustomQuestions from application column data.

### Changes

**File 1: `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts`**

Replace the `ApplicationData` section (lines 344-370) with new logic that:

1. **AppReferrer**: Extract clean brand name from `referral_source` URL
   - `https://www.ziprecruiter.com/` -> `ZipRecruiter`
   - `https://www.indeed.com/` -> `Indeed`
   - Falls back to `source` if `referral_source` is null, then `ATS.me`

2. **StatusTag**: Always `New`

3. **DisplayFields** (auto-populated from application columns):

| DisplayPrompt | Source | Example for Constantine |
|---|---|---|
| Experience Level | `months` mapped to label | Over 1 Year |
| Experience Months | `months` + years calc | 48 (4 years) |
| Veteran Status | `veteran` | No |
| Driver Type | `driver_type` (skip if null) | -- |
| Apply URL | `apply_url` injected by index.ts | ATS.me(https://ats.me/j/{short_code}) |
| Powered By | `powered_by` injected by index.ts | Pemberton AI |

   - Existing JSON `custom_questions`/`display_fields` merged in if present
   - Null/empty values skipped

4. **CustomQuestions** (compliance booleans):

| Question | Source Column(s) |
|---|---|
| Can you pass a drug screening? | `drug` / `can_pass_drug_test` |
| Are you over 21 years of age? | `over_21` / `age` |
| Are you a veteran? | `veteran` |
| Do you consent to data processing? | `consent` |
| Do you agree to the privacy policy? | `privacy` / `agree_privacy_policy` |
| Do you consent to SMS communication? | `consent_to_sms` (skip if null) |
| Do you consent to background check? | `background_check_consent` (skip if null) |

   - Only non-null answers included

5. **Experience Level mapping**:
   - `months >= 12` -> "Over 1 Year"
   - `months >= 3` -> "3-12 Months"
   - `months < 3` -> "Under 3 Months"
   - Falls back to raw `exp` value if `months` is null

6. **Referral source brand extraction** (domain to brand name map):

```text
ziprecruiter.com  -> ZipRecruiter
indeed.com        -> Indeed
linkedin.com      -> LinkedIn
facebook.com      -> Facebook
craigslist.org    -> Craigslist
google.com        -> Google
(other)           -> capitalize domain
```

**File 2: `supabase/functions/ats-integration/index.ts`**

Update the `send_application` case (lines 122-135) to enrich `appData` after fetching from database:

1. Join `job_listings` -> `organizations` to get `company_name`
2. Join `ats_connections` -> `clients` to get the client name for "Powered By" (e.g., "Pemberton AI")
3. Query `job_short_links` for an active short code for this job listing
4. Attach to appData before passing to adapter:
   - `appData.company_name` = org or client name (e.g., "Pemberton Truck Lines Inc")
   - `appData.apply_url` = `https://ats.me/j/{short_code}` or fallback to `https://ats.me/apply?organization_id=...&client_id=...`
   - `appData.powered_by` = client name + " AI" (e.g., "Pemberton AI"), or org name + " AI"

### Expected Output for Constantine

```text
<ApplicationData>
  <AppReferrer>ZipRecruiter</AppReferrer>
  <StatusTag>New</StatusTag>
  <DisplayFields>
    <DisplayField>
      <DisplayPrompt>Experience Level</DisplayPrompt>
      <DisplayValue>Over 1 Year</DisplayValue>
    </DisplayField>
    <DisplayField>
      <DisplayPrompt>Experience Months</DisplayPrompt>
      <DisplayValue>48 (4 years)</DisplayValue>
    </DisplayField>
    <DisplayField>
      <DisplayPrompt>Veteran Status</DisplayPrompt>
      <DisplayValue>No</DisplayValue>
    </DisplayField>
    <DisplayField>
      <DisplayPrompt>Apply URL</DisplayPrompt>
      <DisplayValue>ATS.me(https://ats.me/apply?organization_id=84214b48-...&client_id=67cadf11-...)</DisplayValue>
    </DisplayField>
    <DisplayField>
      <DisplayPrompt>Powered By</DisplayPrompt>
      <DisplayValue>Pemberton AI</DisplayValue>
    </DisplayField>
  </DisplayFields>
  <CustomQuestions>
    <CustomQuestion>
      <Question>Can you pass a drug screening?</Question>
      <Answer>Yes</Answer>
    </CustomQuestion>
    <CustomQuestion>
      <Question>Are you over 21 years of age?</Question>
      <Answer>Yes</Answer>
    </CustomQuestion>
    <CustomQuestion>
      <Question>Are you a veteran?</Question>
      <Answer>No</Answer>
    </CustomQuestion>
    <CustomQuestion>
      <Question>Do you consent to data processing?</Question>
      <Answer>Yes</Answer>
    </CustomQuestion>
    <CustomQuestion>
      <Question>Do you agree to the privacy policy?</Question>
      <Answer>Yes</Answer>
    </CustomQuestion>
  </CustomQuestions>
</ApplicationData>
```

Note: Constantine's job has no active short link, so Apply URL falls back to the universal apply URL with org + client IDs.

### Summary

| File | What Changes |
|---|---|
| `xml-post-adapter.ts` | Lines 344-370: rewrite ApplicationData section with DisplayFields auto-mapping, CustomQuestions, clean referral brand name, StatusTag = "New" |
| `ats-integration/index.ts` | Lines 122-135: enrich appData with company_name, apply_url, powered_by before passing to adapter |

### After Deployment

Re-send Constantine's application to verify enriched payload.

