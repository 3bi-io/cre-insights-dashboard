

## Enable Voice Apply for All AspenView Job Listings

### Problem
Voice Apply is currently hidden in three scenarios for AspenView:
1. **Multi-location grouped jobs** on the detail page — the multi-location branch renders only external apply buttons with no voice option
2. **Job cards on /jobs list** — `PublicJobCard` still has the old `!isExternalApply` guard with no AspenView override
3. **Job context accuracy** — for multi-location jobs, the voice agent receives a combined location string ("Dallas, TX · Tampa, FL") instead of a specific location, making the screening conversation inaccurate

### Changes

#### 1. `src/components/public/PublicJobCard.tsx` — Enable voice on job cards
- Line 54: Change `showVoiceButton` logic to include AspenView override
- `const showVoiceButton = hasVoiceAgent && isVoiceSupported && onVoiceApply && (!isExternalApply || isAspenViewClientId(job.client_id)) && !isMultiLocation;`
- Import `isAspenViewClientId` from `@/utils/aspenviewJobGrouping`

#### 2. `src/features/jobs/components/public/JobSidebar.tsx` — Add voice button to multi-location view
- In the multi-location branch (lines 90-112), add a single "Apply with Voice" button below the per-location external apply buttons
- This lets candidates start a voice screening for the role regardless of which location they prefer — the agent will ask about location preference during the conversation
- Update the `ReadinessBadges` line to show voice badge for AspenView multi-location jobs too

#### 3. `src/pages/public/JobDetailsPage.tsx` — Enable voice for multi-location detail views
- Line 290: Remove the `!isMultiLocation` guard for AspenView jobs: `showVoiceButton={!isMultiLocation ? (!isExternalApply || isAspenViewJob(job.client_id)) : isAspenViewJob(job.client_id)}`
- Lines 314-336 (mobile multi-location CTA): Add a voice apply button below the location-specific apply buttons, mirroring the sidebar pattern

#### 4. `src/pages/public/JobDetailsPage.tsx` — Enrich voice context for multi-location
- Update `handleVoiceApply` (line 128) to pass all available locations when multi-location: `location: isMultiLocation ? locationVariants.map(v => v.location).join(', ') : (displayLocation || 'Various locations')`
- This gives the agent explicit knowledge of all locations so it can ask the candidate which they prefer

#### 5. `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts` — Pass job_id in metadata
- Verify that `job_listing_id` is passed in the metadata/dynamic variables so the webhook correctly attributes the conversation (already present via `jobId` in context — confirm and add explicit `job_listing_id` dynamic variable if missing)

### Agent Context Verification
The dynamic variables injected into ElevenLabs (line 284-295 of `useVoiceAgentConnection.ts`) already pass:
- `job_title` — from the listing title
- `company_name` — "AspenView Technology Partners"
- `job_description` — full transformed description including duties, requirements, compensation
- `job_location` — will now include all locations for multi-location roles
- `salary_range` — from salary_min/max formatting
- `job_requirements` — extracted qualifications
- `job_benefits` — structured benefits data

This means the agent has full context about the role's content, location(s), and compensation when screening candidates.

### Files to modify
| File | Change |
|------|--------|
| `src/components/public/PublicJobCard.tsx` | Add AspenView override to voice button visibility |
| `src/features/jobs/components/public/JobSidebar.tsx` | Add voice button in multi-location branch |
| `src/pages/public/JobDetailsPage.tsx` | Enable voice for multi-location, enrich location context, add mobile voice CTA |

