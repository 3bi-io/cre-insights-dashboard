

# Remove Platform Default Voice Agent Fallback

## Summary
Currently, every job shows "Voice Apply" because both the frontend and backend fall back to a global platform-default agent when no specific agent is assigned. This change removes that fallback so Voice Apply only appears for clients/orgs with a dedicated agent.

## Changes

### 1. Frontend: Stop hardcoding `voiceAgent: { global: true }`
Currently `usePaginatedPublicJobs.tsx` and `useJobDetails.tsx` unconditionally attach `voiceAgent: { global: true }` to every job. Instead, query the `voice_agents` table to check if the job's org/client actually has an active inbound agent assigned.

**Files**: `src/hooks/usePaginatedPublicJobs.tsx`, `src/hooks/useJobDetails.tsx`

- Query `voice_agents` for each unique `organization_id` (and optionally `client_id`) to check if an active agent exists
- Only set `voiceAgent` on jobs that have a matching agent; leave it `null` otherwise
- This naturally disables `hasVoiceAgent` → `showVoiceButton` → Voice Apply CTA for unassigned clients

### 2. Remove `VOICE_APPLY_CLIENT_IDS` hardcoded allow-list
Since voice visibility will now be driven by actual agent assignment in the database, the static client ID set is no longer needed.

**File**: `src/utils/aspenviewJobGrouping.ts`
- Remove `VOICE_APPLY_CLIENT_IDS` set and `isVoiceApplyEnabled()` function

**Files**: `src/components/public/PublicJobCard.tsx`, `src/pages/public/JobDetailsPage.tsx`, `src/features/jobs/components/public/JobSidebar.tsx`
- Replace `isVoiceApplyEnabled(job.client_id)` checks with the existing `hasVoiceAgent` / `!!job.voiceAgent` check (which now reflects real DB state)
- For external-apply jobs, show Voice Apply if the job has a voice agent assigned (regardless of external URL)

### 3. Backend: Remove platform default fallback from outbound call trigger

**DB trigger** (`trigger_application_insert_outbound_call`): Remove PRIORITY 3 block that falls back to `is_platform_default = true`. If no client-specific or org-level agent exists, no outbound call is queued.

**Edge function** (`supabase/functions/elevenlabs-outbound-call/index.ts`): Remove the "Final fallback - platform default" block (lines ~951-967) that queries for `is_platform_default = true`.

### 4. Backend: Relax org-check for inbound agent access

**Edge function** (`supabase/functions/elevenlabs-agent/index.ts`): The `is_platform_default` check on line 149 allows cross-org access for platform-default agents. Since we're removing that concept, simplify the auth check — agents are accessible if they match the requesting user's org, or if the request is unauthenticated (public web voice apply).

### 5. Submit-application edge function
**File**: `supabase/functions/submit-application/index.ts` (lines ~1236-1247)
- No change needed — it already checks for org-level agent only, no platform default fallback here.

## Result
- Werner, Hub Group, TMC (and any client without a dedicated agent) will **not** show Voice Apply
- Clients with assigned agents (AspenView, Pemberton, Day & Ross, Novco, James Burg, Danny Herman, R.E. Garrison) continue showing it
- Adding Voice Apply to a new client = inserting a `voice_agents` row for that client/org

