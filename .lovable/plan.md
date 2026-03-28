

## Enable Voice Apply for Multi-Location Jobs + Verify Agent Context

### What's Already Done
- Voice Apply button already shows in the **sidebar** and **mobile CTA** for multi-location AspenView jobs (lines 118-128 and 340-349)
- `handleVoiceApply` in JobDetailsPage already passes all locations comma-separated for multi-location jobs
- `job_listing_id` is passed as a dynamic variable to ElevenLabs

### What's Missing
The **job card** on the `/jobs` list page (`PublicJobCard.tsx` line 55) has `&& !isMultiLocation` which hides Voice Apply for grouped multi-location AspenView jobs on the listing page.

### Changes

#### 1. `src/components/public/PublicJobCard.tsx` — Remove multi-location exclusion for AspenView
- Line 55: Change from `&& !isMultiLocation` to allow AspenView multi-location jobs
- New logic: `const showVoiceButton = hasVoiceAgent && isVoiceSupported && onVoiceApply && (!isExternalApply || isAspenViewClientId(job.client_id)) && (!isMultiLocation || isAspenViewClientId(job.client_id));`
- Update `handleVoiceApply` (line 65) to pass all locations for multi-location jobs: `location: isMultiLocation ? locationVariants.map(v => v.location).join(', ') : (displayLocation || 'Various locations')`

#### 2. Agent Context Verification
The dynamic variables injected into ElevenLabs already pass complete job context:
- `job_title` — listing title
- `job_description` — full description with duties, requirements, compensation
- `job_location` — all locations comma-separated for multi-location roles (e.g., "Dallas, TX, Tampa, FL")
- `salary_range`, `job_requirements`, `job_benefits` — structured data
- `job_listing_id` — for webhook attribution

This gives the agent full awareness of available locations so it can ask candidates which location they prefer during screening.

### Technical Details
| File | Change |
|------|--------|
| `src/components/public/PublicJobCard.tsx` | Remove `!isMultiLocation` guard for AspenView, pass all locations in voice context |

