

## Fix DisplayFields XML Bug + Auto-Post Audit Trail + Re-send Mitchell

### Bug 1: Compliance Data and Transcripts Never Sent (Critical)

**Root cause:** In `xml-post-adapter.ts`, the `<DisplayFields>` XML block is emitted at lines 394-405, but compliance booleans (drug screening, over 21, consent, etc.) and the call transcript are pushed to the `displayFields` array AFTER the XML has already been written (lines 408-429). These items are added to the array but never appear in the output XML.

This means **none** of the previous re-sends actually included compliance data or transcripts in the XML payload, despite logging that they were "attached."

**Fix:** Move the compliance and transcript pushes BEFORE the XML emission block. Reorganize lines 350-406 so all `displayFields.push()` calls happen first, then emit the XML once.

### Bug 2: Auto-Post Missing `request_payload` in Sync Logs

**Root cause:** In `auto-post-engine.ts` line 220-228, the `ats_sync_logs` insert does not include `request_payload`. The manual re-send path (`ats-integration/index.ts` line 201) does include it via `sanitizePayload()`. This is why Mitchell's sync log had a null payload.

**Fix:** Add `request_payload: sanitizePayload(enrichedData)` to the auto-post sync log insert. Import or inline a `sanitizePayload` helper.

### Changes

#### File 1: `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts`

Reorganize the DisplayFields section (lines 349-406) so ALL display field items are collected before any XML is emitted:

1. Build the array with experience, veteran, driver type, apply URL, powered by, display_fields JSON (existing, lines 350-392)
2. Add compliance booleans: drug, over 21, consent, privacy, SMS, background check (currently lines 408-424, move up)
3. Add call transcript (currently line 427-429, move up)
4. THEN emit the `<DisplayFields>` XML block (currently lines 394-405)

No logic changes -- just reordering so the pushes happen before the XML write.

#### File 2: `supabase/functions/_shared/ats-adapters/auto-post-engine.ts`

- Add a `sanitizePayload` helper function (same as in `ats-integration/index.ts`)
- Add `request_payload: sanitizePayload(enrichedData)` to both sync log inserts (success at line 220 and error at line 247)

### Deployment

Deploy `ats-integration` and `submit-application` (which bundles the shared adapters).

### Verification

Re-send all 4 applications (Constantine, William, Samuil, Mitchell) to confirm:
- Compliance DisplayFields appear in the XML
- Transcript DisplayField appears in the XML (where available)
- `ats_sync_logs.request_payload` is populated
- No Tenstreet warnings

### End-to-End Workflow Confirmation

After these fixes, the complete automated pipeline:

1. Application submitted (web/voice) -> `submit-application` -> `autoPostToATS`
2. Auto-post enriches with transcript -> builds XML with ALL DisplayFields -> POSTs to Tenstreet
3. Sync log records full sanitized payload + response
4. Manual re-sends via `ats-integration` follow the same path
5. All compliance data and transcripts route correctly through DisplayFields
