

## Review: Call Scheduling & Client-Level Availability

### Current State

**Call Schedule Settings** (`organization_call_settings` table):
- Scoped to `organization_id` only (unique constraint on `organization_id`)
- Stores: business hours (start/end/timezone), business days, follow-up rules (enabled, max attempts, delay)
- RLS: super admins full access; org admins can view/update their own org's settings
- UI: Single form in the ElevenLabs Admin "Schedule" tab — no client selector

**Voice Agents** (`voice_agents` table):
- Supports `client_id` for client-specific agent assignment
- Outbound call trigger (`trigger_application_insert_outbound_call`) resolves agents by priority: client-specific → org-level → platform default

**Gap**: There is **no client-level call scheduling**. Business hours and follow-up rules apply uniformly across the entire organization. An org admin cannot configure different availability windows per client (e.g., Client A operates 7am-3pm CT while Client B operates 9am-5pm ET).

### Proposed Plan

**1. Database: Add `client_id` to `organization_call_settings`**
- Add nullable `client_id` column referencing `clients(id)`
- Change the unique constraint from `(organization_id)` to `(organization_id, client_id)` using a unique index with `COALESCE(client_id, '00000000-...')` to handle NULLs
- Add RLS policies for org admins to manage client-level rows
- The org-level row (where `client_id IS NULL`) serves as the default/fallback

**2. Database: Update `is_within_business_hours` and `get_next_business_hours_start`**
- Add optional `p_client_id UUID DEFAULT NULL` parameter to both functions
- Query logic: look for a client-specific row first, fall back to the org-level row

**3. Database: Update outbound call trigger**
- Pass `v_client_id` to `is_within_business_hours` when checking call eligibility so client-specific hours are respected

**4. Hook: Extend `useCallScheduleSettings`**
- Accept an optional `clientId` parameter
- Query/upsert with the `client_id` filter
- Provide a `clientSettings` list for displaying all client-level overrides

**5. UI: Add client selector to `CallScheduleSettings` component**
- Add a dropdown at the top: "Organization Default" + list of clients
- When a client is selected, load/save that client's specific schedule
- Visual indicator showing which clients have custom schedules vs. inheriting org defaults

### Files Affected
- 1 migration (schema + function updates)
- `src/features/elevenlabs/hooks/useCallScheduleSettings.ts`
- `src/components/voice/CallScheduleSettings.tsx`

### Technical Notes
- The unique constraint uses `COALESCE` pattern since Postgres treats `NULL != NULL` in unique constraints
- Org admins already have RLS access to their org's settings; the new policy extends this to client-scoped rows within their org
- Existing org-level rows remain untouched — backward compatible

