

## Fix Custom Question Routing + End-to-End Workflow Automation

### Problem 1: CustomQuestion XML Missing QuestionId

The Tenstreet API requires every `<CustomQuestion>` to have a `<QuestionId>` tag that matches a pre-configured question in Tenstreet's dashboard for the given CompanyId. The current `xml-post-adapter.ts` (lines 449-454) generates:

```xml
<CustomQuestion>
  <Question>Can you pass a drug screening?</Question>
  <Answer>yes</Answer>
</CustomQuestion>
```

But Tenstreet expects:

```xml
<CustomQuestion>
  <QuestionId>drug_screening</QuestionId>
  <Question>Can you pass a drug screening?</Question>
  <Answer>yes</Answer>
</CustomQuestion>
```

Without the `<QuestionId>`, Tenstreet returns the warning "Custom Question not found for CompanyId provided" and silently drops the data.

**Solution:** Move all dynamic data (compliance booleans, transcript, etc.) to `<DisplayFields>` instead of `<CustomQuestions>`. DisplayFields do NOT require pre-configuration in Tenstreet -- they appear as read-only info on the applicant's profile. CustomQuestions should only be used when the question IDs are explicitly mapped and known to exist in the company's Tenstreet config.

### Problem 2: Auto-Post Skips Transcript Enrichment

When a new application comes in via `submit-application`, the auto-post flow calls `autoPostToATS()` which passes raw application data directly to the adapter. It does NOT run the transcript enrichment logic (fetching outbound call transcripts from ElevenLabs). That enrichment only exists in `ats-integration/index.ts` for manual re-sends.

For inbound web/voice applications, transcripts won't exist at auto-post time (the call hasn't happened yet). But for follow-up outbound calls that trigger a re-post, the enrichment is needed.

**Solution:** Extract the transcript enrichment logic into a shared helper function and call it from both `ats-integration/index.ts` and `auto-post-engine.ts`.

---

### Changes

#### File 1: `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts`

**Move compliance booleans and transcript from CustomQuestions to DisplayFields (lines 408-458)**

- Drug screening, over 21, veteran, consent, privacy, SMS consent, background check consent, and call transcript all become DisplayFields
- Remove the entire CustomQuestions block for dynamic/unmapped questions
- Keep the CustomQuestions section ONLY if the application has explicit `custom_questions` with proper IDs from field mapping config

Before (simplified):
```
DisplayFields: [Experience Level, Experience Months, Veteran, Apply URL, Powered By]
CustomQuestions: [drug, over21, veteran, consent, privacy, sms, background, transcript]
```

After:
```
DisplayFields: [Experience Level, Experience Months, Veteran, Apply URL, Powered By, 
                Drug Screening, Over 21, Consent, Privacy, SMS Consent, 
                Background Check Consent, Voice Transcript]
CustomQuestions: (only if field mapping defines explicit QuestionIds)
```

#### File 2: `supabase/functions/_shared/ats-adapters/transcript-enrichment.ts` (NEW)

Extract the transcript enrichment logic from `ats-integration/index.ts` into a shared utility:

- `enrichWithTranscript(supabase, appData)` -- queries outbound_calls, fetches transcript from ElevenLabs if needed, returns enriched appData with `call_transcript`
- Includes the broadened status filter, auto-fetch from ElevenLabs API, and status sync

#### File 3: `supabase/functions/ats-integration/index.ts`

- Replace inline transcript enrichment block (lines 138-254) with a call to the new shared `enrichWithTranscript()` function

#### File 4: `supabase/functions/_shared/ats-adapters/auto-post-engine.ts`

- Import and call `enrichWithTranscript()` before sending to the adapter (after line 164, before `adapter.sendApplication`)
- This ensures outbound follow-up call transcripts are included when applications are re-posted

### Deployment

Deploy updated edge functions: `ats-integration`, `submit-application` (uses auto-post-engine)

### After Deployment

Re-send the 3 applications (Constantine, William, Samuil) to verify:
- Transcript appears as a DisplayField (not CustomQuestion)
- No "Custom Question not found" warnings from Tenstreet
- All data is visible on the applicant profile in Tenstreet

### End-to-End Workflow Confirmation

After these changes, the complete automated flow for any received application:

1. Application submitted via web form or voice call -> `submit-application`
2. Auto-post fires immediately -> `autoPostToATS` -> `xml-post-adapter`
3. If outbound follow-up call happens later -> call completes -> manual or automated re-send triggers `ats-integration`
4. Both paths now call `enrichWithTranscript()` to fetch and attach any available call transcript
5. All dynamic data routes through DisplayFields (no Tenstreet config required)

