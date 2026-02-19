
# Geo-Restricted Application Simulation for Non-Americas Users

## What Is Being Built & Why

Users outside North and South America can currently browse all job listings but — once the old allow-list was removed — they can technically reach and submit the real `/apply` form. The request is to:

1. **Let them browse everything** — jobs, features, clients, etc. — without any restriction.
2. **When they try to apply**, show them a **simulation mode** of the full application wizard, clearly labeled as a demo due to geo-restrictions, and **never submit real data** to the database.
3. At the end of the simulation, show a polished "simulation complete" screen explaining why real submission isn't available from their region.

---

## How "Non-Americas" Is Detected

The `GeoBlockingContext` already exposes `countryCode` to all components. The OFAC block-list approach (current state) only blocks 6 sanctioned countries — it does not track whether someone is from Americas vs. elsewhere.

We need to **add a new derived flag** to the context: `isOutsideAmericas`. This is computed client-side from the `countryCode` returned by the existing `geo-check` edge function — no backend changes needed.

### Americas Country Codes (ISO 3166-1 alpha-2)

North America: `US`, `CA`, `MX`, `GT`, `BZ`, `HN`, `SV`, `NI`, `CR`, `PA`
Caribbean: `CU` (blocked anyway), `JM`, `HT`, `DO`, `PR`, `TT`, `BB`, `LC`, `VC`, `GD`, `AG`, `KN`, `BS`, `TC`, `KY`, `VG`, `VI`, `AW`, `CW`, `BQ`, `MF`, `SX`, `AI`, `MS`, `GP`, `MQ`, `MF`, `BL`, `DM`
South America: `CO`, `VE`, `GY`, `SR`, `BR`, `EC`, `PE`, `BO`, `CL`, `AR`, `UY`, `PY`, `FK`, `GF`
Other: `GL` (Greenland/Denmark, geographically Americas)

> Previously `ES` (Spain) and `AM` (Armenia) were on the allow-list. These are geographically outside the Americas. Under the new policy they get "simulate" mode.

---

## Architecture

```text
GeoBlockingContext
  ├── isBlocked          → Full hard block (OFAC sanctioned)
  ├── isOutsideAmericas  → NEW: soft restriction (simulate apply)
  └── countryCode        → already exposed

Apply Page (/apply)
  └── ApplicationForm
        └── reads isOutsideAmericas from context
              ├── false → Real form (existing behavior)
              └── true  → SimulatedApplicationForm (new component)

/apply/detailed
  └── DetailedApplicationForm
        └── same isOutsideAmericas check → SimulatedApplicationForm
```

---

## Files to Create or Modify

### 1. `src/contexts/GeoBlockingContext.tsx` — Add `isOutsideAmericas`

- Add `AMERICAS_COUNTRY_CODES` set (all North + South American ISO codes).
- Add `isOutsideAmericas: boolean` field to `GeoBlockingState` and `GeoBlockingContextType`.
- Compute `isOutsideAmericas = countryCode !== null && !AMERICAS_COUNTRY_CODES.has(countryCode)` after a successful geo-check.
- Fail-open: if `countryCode` is `null` (lookup failed), `isOutsideAmericas = false` (don't restrict unknown users).
- The Lovable preview bypass already returns `countryCode: 'US'`, so preview always gets `isOutsideAmericas = false`.

### 2. `src/components/apply/SimulatedApplicationForm.tsx` — New Component

A **pixel-perfect replica** of `ApplicationForm` that:
- Renders all 4 real steps (PersonalInfoSection, CDLInfoSection, BackgroundInfoSection, ConsentSection) — same layout, same fields.
- Uses `useStepWizard` for navigation — the user walks through every step normally.
- Accepts input and shows validation — feels identical to the real form.
- Has a **persistent amber banner** at the top of the card:
  ```
  🌐 Simulation Mode — Geo Restriction Active
  Applications from [Country] are view-only. This is a demo of the application experience.
  Data entered here will NOT be submitted.
  ```
- On "Submit Application" click on the final step: navigates to a new **SimulationCompleteScreen** instead of calling the real submit endpoint.
- The submit button text changes to **"Complete Simulation"** on the final step.
- No draft persistence (data is never saved).
- No `ZipRecruiterPixel` fires.

### 3. `src/components/apply/SimulationCompleteScreen.tsx` — New Component

Shown after the user "completes" the simulated application. It mirrors the real ThankYou screen's card layout but with:
- A globe/info icon (not a check mark).
- Headline: **"Simulation Complete"**
- Sub-copy: "You've previewed the full CDL driver application process. Unfortunately, applications from [Country] cannot be submitted at this time as this platform currently serves employers and job seekers in the Americas."
- A clear call-to-action: "View Available Jobs" → `/jobs` and "Learn More About ATS.me" → `/features`.
- **No** confirmation emails or voice agent calls are triggered.

### 4. `src/pages/Apply.tsx` — Wire Simulation Mode

- Import `useGeoBlocking` and read `isOutsideAmericas`.
- If `isOutsideAmericas === true`, render `<SimulatedApplicationForm>` instead of `<ApplicationForm>`.
- The `ApplicationHeader` (job title, client logo, location) is still shown above both — the experience looks real up until the banner.

### 5. `src/components/apply/detailed/DetailedApplicationForm.tsx` — Wire Simulation Mode

- Same pattern: import `useGeoBlocking`, check `isOutsideAmericas`.
- Swap in `<SimulatedApplicationForm variant="detailed">` which shows all 6 detailed steps.
- Or reuse `SimulatedApplicationForm` with a prop to render either 4-step or 6-step variant.

### 6. `src/components/apply/ApplicationForm.tsx` — No change needed

The gate lives at the page level (`Apply.tsx`), so `ApplicationForm` itself doesn't need to change.

---

## User Flow Diagram

```text
User (non-Americas) clicks "Apply Now" on a job listing
        ↓
/apply page loads
        ↓
useGeoBlocking() → isOutsideAmericas = true
        ↓
ApplicationHeader (job title, logo) renders normally
        ↓
SimulatedApplicationForm renders
  ┌─────────────────────────────────────────┐
  │  🌐 SIMULATION MODE banner (amber)      │
  │  Step 1 — Personal Info (real fields)   │
  │  [Continue] →                           │
  │  Step 2 — CDL Info (real fields)        │
  │  [Continue] →                           │
  │  Step 3 — Background (real fields)      │
  │  [Continue] →                           │
  │  Step 4 — Consent (real fields)         │
  │  [Complete Simulation] button            │
  └─────────────────────────────────────────┘
        ↓
SimulationCompleteScreen
  ┌─────────────────────────────────────────┐
  │  🌐 Simulation Complete                 │
  │  "You've previewed the application..."  │
  │  [View Jobs] [Learn More]               │
  └─────────────────────────────────────────┘
```

---

## Technical Details

- `SimulatedApplicationForm` shares all existing step components (`PersonalInfoSection`, `CDLInfoSection`, etc.) — no duplication of form fields.
- Uses `useStepWizard` and `useApplicationForm`'s `formData`/`handleInputChange` for state, but overrides `handleSubmit` to never call the API.
- The simulation banner uses `Alert` from the UI library with an amber/warning variant.
- `isOutsideAmericas` is cached in sessionStorage alongside the existing `geo_blocking_result` cache — computed at cache-write time so it's available instantly on revisit.
- The Lovable preview bypass (`countryCode: 'US'`) means the simulation will never fire during development.

---

## Edge Cases Handled

- **Geo lookup failure** → `isOutsideAmericas = false` → real form shown (fail-open, consistent with OFAC policy).
- **OFAC-sanctioned country** → `isBlocked = true` → hard block page shown, never reaches /apply.
- **US/Canada/Mexico** → `isOutsideAmericas = false` → real form.
- **Spain, Armenia, EU, Asia, Africa** → `isOutsideAmericas = true` → simulation mode.
- **Lovable preview** → `countryCode = 'US'` → always real form.

---

## Summary of Files Changed

| File | Action |
|---|---|
| `src/contexts/GeoBlockingContext.tsx` | Add `isOutsideAmericas` flag + `AMERICAS_COUNTRY_CODES` set |
| `src/components/apply/SimulatedApplicationForm.tsx` | Create — full 4-step simulation wrapper |
| `src/components/apply/SimulationCompleteScreen.tsx` | Create — post-simulation success-like screen |
| `src/pages/Apply.tsx` | Wire: render SimulatedApplicationForm if `isOutsideAmericas` |
| `src/components/apply/detailed/DetailedApplicationForm.tsx` | Wire: same gate for 6-step detailed form |
