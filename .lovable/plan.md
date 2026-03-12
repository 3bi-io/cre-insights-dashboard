
Goal: fix the Nylas connect flow so “Status 31004: integration_not_found” no longer appears when clicking Connect Calendar.

What I found from the current code
- The OAuth URL is generated in `supabase/functions/calendar-integration/index.ts` (`handleOAuthUrl`).
- It currently hardcodes:
  - `provider=google`
  - `NYLAS_API_BASE = https://api.us.nylas.com`
- This makes the flow brittle. If your Nylas app/provider/region differs, Nylas returns integration/app-not-found style errors before callback.
- The admin UI (`src/components/voice/RecruiterCalendarConnect.tsx` and `src/pages/RecruiterCalendarPage.tsx`) just opens the returned URL, so the root issue is upstream in OAuth URL generation/config.

Implementation plan
1) Add region-safe Nylas API base configuration
- Update `calendar-integration` function to support `NYLAS_API_BASE` secret (default to US only if missing).
- Use this base for both:
  - `/v3/connect/auth`
  - `/v3/connect/token`
- This removes hardcoded-region failures (common cause of “integration not found”).

2) Remove hardcoded provider lock-in
- In `handleOAuthUrl`, stop forcing `provider: 'google'`.
- Accept optional `provider` from request only when explicitly selected and valid.
- If no provider is passed, let Nylas hosted auth handle provider choice/configuration.
- Update admin/recruiter connect UI to optionally pass provider (Google/Microsoft) or “Auto”.

3) Improve diagnostics from edge function
- Add an action like `oauth_diagnostics` in `calendar-integration` that returns a sanitized config check:
  - whether `NYLAS_CLIENT_ID`, `NYLAS_API_KEY`, `NYLAS_REDIRECT_URI` are present
  - active API base host
  - generated auth URL host/params (redacted where needed)
- This gives quick visibility instead of blind retries.

4) Improve user-facing error clarity
- In `CalendarCallback.tsx`, parse and display `error_description` (if returned).
- In connect UI toast, show actionable guidance when Nylas returns app/provider/region mismatch.
- Add a short “If you see 31004, verify Nylas client/region/provider config” hint in the Schedule tab.

5) Validation checklist (end-to-end)
- Trigger Connect Calendar from `/admin/elevenlabs-admin` Schedule tab.
- Confirm popup opens with correct Nylas host and no 31004.
- Complete provider auth and confirm callback page shows success.
- Confirm a row is written to `recruiter_calendar_connections`.
- Run `test_connection` action and ensure healthy response.

Technical details (files to update)
- `supabase/functions/calendar-integration/index.ts`
  - make API base configurable
  - provider optional/validated
  - add diagnostics action
- `src/components/voice/RecruiterCalendarConnect.tsx`
  - optional provider selector + payload wiring
- `src/pages/RecruiterCalendarPage.tsx`
  - same provider handling for recruiter self-service flow
- `src/pages/CalendarCallback.tsx`
  - better error surface for OAuth failures

```text
Current:
UI -> oauth_url (provider=google, api.us fixed) -> Nylas error 31004

Planned:
UI -> oauth_url (provider optional, api base configurable) -> Nylas auth -> callback -> token exchange -> DB save
```

Non-code config checks to run alongside implementation
- Confirm `NYLAS_CLIENT_ID` and `NYLAS_API_KEY` are from the same Nylas app.
- Confirm app region matches `NYLAS_API_BASE` (US vs EU).
- Confirm callback URI remains exactly `https://applyai.jobs/calendar/callback` in both Nylas and secret.
