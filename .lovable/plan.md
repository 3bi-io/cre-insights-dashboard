

## Enable Voice Apply for All Companies with External Apply URLs

### Problem
Voice Apply is hardcoded to only bypass the external-URL block for AspenView. Four Hayes clients (Pemberton, Day & Ross, Novco, James Burg) with 162 combined jobs are excluded despite the same use case — voice screening before external ATS redirect.

### Approach
Replace the hardcoded `isAspenViewClientId()` check with a configurable client-level flag. Two options:

**Option A — Database flag (recommended)**: Add `enable_voice_apply boolean` column to the clients table, set it per client, and query it alongside job data. Most flexible, admin-controllable.

**Option B — Code-level allow list**: Replace the single AspenView ID check with a set of client IDs. Faster to ship, but requires code changes to add/remove clients.

### Changes (Option B — immediate, no migration needed)

#### 1. `src/utils/aspenviewJobGrouping.ts` → Create a general voice-enabled check
- Add a `VOICE_APPLY_CLIENT_IDS` set containing AspenView + Pemberton + Day & Ross + Novco + James Burg IDs
- Export `isVoiceApplyEnabled(clientId)` function that checks membership
- Keep `isAspenViewClientId()` for AspenView-specific display logic (description transform, grouping)

#### 2. `src/components/public/PublicJobCard.tsx`
- Replace `isAspenViewClientId(job.client_id)` in the `showVoiceButton` line with `isVoiceApplyEnabled(job.client_id)`
- Multi-location guard: also use `isVoiceApplyEnabled` (currently only AspenView has multi-location grouping anyway)

#### 3. `src/pages/public/JobDetailsPage.tsx`
- Replace `isAspenViewJob(job.client_id)` in `showVoiceButton` prop (lines 293, 354) with `isVoiceApplyEnabled(job.client_id)`
- Keep AspenView-specific logic (description transform, sibling grouping) unchanged

#### 4. `src/features/jobs/components/public/JobSidebar.tsx`
- Replace `isAspenView` check for ReadinessBadges voice indicator with `isVoiceApplyEnabled`

### Client IDs for Allow List
| Client | ID |
|--------|-----|
| AspenView Technology | `82513316-7df2-4bf0-83d8-6c511c83ddfb` |
| Pemberton Truck Lines | `67cadf11-8cce-41c6-8e19-7d2bb0be3b03` |
| Day and Ross | `30ab5f68-258c-4e81-8217-1123c4536259` |
| Novco, Inc. | `4a9ef1df-dcc9-499c-999a-446bb9a329fc` |
| James Burg Trucking | `b2a29507-32a6-4f5e-85d6-a7e6ffac3c52` |
| Werner Enterprises | `feb3479f-4116-42a5-bb6a-811406c1c99a` |
| Hub Group | `8ca3faca-b91c-4ab8-a9af-b145ab265228` |
| TMC Transportation | `50657f4d-c47b-4104-a307-b82d5fa4a1df` |

### Result
All 8 external-apply clients get Voice Apply on both the job card and detail page. Internal-apply clients (Danny Herman, R.E. Garrison, Dollar Tree, etc.) continue working as-is since they already show voice.

