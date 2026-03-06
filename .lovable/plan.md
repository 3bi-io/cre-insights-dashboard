

## AspenView Cybersecurity Org -- Audit & Refacing Plan

### Current State Assessment

**What's working:**
- Organization `Aspen Analytics` is correctly tagged `industry_vertical: 'cyber'`
- Client `Aspenview Technology Partners` exists and is linked to the org
- 40 active jobs synced from Rippling (hourly cron running)
- Appears in `public_client_info` view with `industry_vertical: cyber`
- Shows under the "Cyber" filter pill on `/clients`
- All 12 platform features enabled (AI, voice, analytics, etc.)
- Apply URLs correctly route to `/apply?job_id=...`

**Critical gaps found:**

| Issue | Impact | Severity |
|-------|--------|----------|
| **All 40 jobs categorized as "Driver Recruitment"** | Cyber jobs showing trucking category | High |
| **No screening questions configured** | No cyber-specific screening (clearance, certs) | High |
| **Application form is CDL-specific** (Step 2 = CDLInfoSection) | Cyber candidates asked about CDL class/endorsements | Critical |
| **No voice agent configured** for Aspen Analytics org | No outbound screening calls after apply | Medium |
| **Client has no logo_url** | Missing branding on cards, apply page, /clients page | Medium |
| **Client has no city/state** | Missing location on public-facing cards | Low |
| **Location data is messy** — "Remoto (Argentina)", "Remoto (Bogotá" (truncated) | Broken display, inconsistent filtering | Medium |
| **No salary data** on any of the 40 jobs | Empty salary range on job cards | Low |
| **Form is not industry-aware** — no conditional logic based on vertical | All applicants see trucking-oriented fields | Critical |

### Recommended Refacing Plan

#### Phase 1: Data Fixes (Database only, no code changes)
1. **Re-categorize jobs** -- Create a "Cybersecurity" job category and update all 40 AspenView listings
2. **Add screening questions** to the Aspen Analytics org tailored to cyber: security clearance level, certifications (CISSP/CISM/CEH), years in cybersecurity, remote work capability
3. **Fix location data** -- Normalize "Remoto (X)" entries to proper city/state with a `remote` flag, fix truncated entries like "Remoto (Bogotá"
4. **Set client logo and location** -- Add AspenView branding

#### Phase 2: Industry-Aware Application Form (Code changes)
This is the most critical gap. Currently, **every applicant** sees CDL-specific fields regardless of industry.

**Approach:**
1. Add `industry_vertical` to the `useApplyContext` hook by resolving it from the job's organization
2. Create a new `TechInfoSection` component (parallel to `CDLInfoSection`) for cyber/general verticals -- collects: years of experience, key certifications, clearance level, tech stack, remote preference
3. Make `ApplicationForm`, `SimulatedApplicationForm`, and `EmbedApplicationForm` conditionally render `CDLInfoSection` vs `TechInfoSection` based on the resolved vertical
4. Update `FormProgressIndicator` step labels to be industry-aware ("CDL & Experience" vs "Skills & Certifications")

**Files to create/modify:**
- **Create** `src/components/apply/TechInfoSection.tsx` -- cyber/general skills form
- **Modify** `src/hooks/useApplyContext.ts` -- resolve `industry_vertical` from org
- **Modify** `src/components/apply/ApplicationForm.tsx` -- conditional step rendering
- **Modify** `src/components/apply/SimulatedApplicationForm.tsx` -- same
- **Modify** `src/components/apply/EmbedApplicationForm.tsx` -- same
- **Modify** `src/components/apply/FormProgressIndicator.tsx` -- dynamic step labels

#### Phase 3: Voice Agent Setup
- Configure a voice agent for the Aspen Analytics org with cyber-specific screening prompts (clearance, certs, experience)
- This is a dashboard/admin action rather than a code change

#### Phase 4: Rippling Sync Improvements
- Update `sync-rippling-feeds` to map departments to proper categories (Technology → "Cybersecurity", Sales → "Sales", etc.) instead of defaulting to "Driver Recruitment"
- Fix the location parser to handle "Remoto (X)" format correctly

### Priority Order
1. **Phase 2** (industry-aware form) -- this is user-facing and currently broken for non-trucking applicants
2. **Phase 4** (sync fixes) -- prevents re-categorization from being overwritten on next sync
3. **Phase 1** (data fixes) -- one-time corrections
4. **Phase 3** (voice agent) -- enhancement

