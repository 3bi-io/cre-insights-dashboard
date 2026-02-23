

# Add Voice Agent Schedule Management UI

## Problem

The `organization_call_settings` database table stores per-organization call scheduling configuration (business hours, follow-up rules), but there is zero UI to view or edit these settings. Admins currently have no way to configure when outbound calls should occur or how follow-ups are handled.

## Database Schema (already exists)

```text
organization_call_settings
  - business_hours_start    (e.g. "09:00:00")
  - business_hours_end      (e.g. "16:30:00")
  - business_hours_timezone (e.g. "America/Chicago")
  - business_days            (e.g. [1,2,3,4,5])
  - auto_follow_up_enabled  (boolean)
  - max_attempts             (integer)
  - follow_up_delay_hours   (integer)
```

## Plan

### 1. New Component: `src/components/voice/CallScheduleSettings.tsx`

A settings panel with two sections:

**Business Hours**
- Time pickers for start/end hours
- Timezone selector (US timezones: Eastern, Central, Mountain, Pacific)
- Day-of-week checkboxes (Mon-Sun) using the `business_days` integer array (1=Mon, 7=Sun)
- Visual "current status" badge showing whether it's currently within business hours

**Follow-Up Rules**
- Toggle for `auto_follow_up_enabled`
- Number input for `max_attempts` (1-10)
- Number input for `follow_up_delay_hours` (1-72)

Save button triggers upsert to `organization_call_settings`.

### 2. New Hook: `src/features/elevenlabs/hooks/useCallScheduleSettings.ts`

- `useQuery` to fetch current settings from `organization_call_settings` for the user's organization
- `useMutation` to upsert settings
- Expose `settings`, `isLoading`, `updateSettings`, `isUpdating`

### 3. Integrate into ElevenLabsAdmin: `src/pages/ElevenLabsAdmin.tsx`

- Add a "Schedule" tab (with Clock icon) to the existing TabsList, positioned after "Outbound Calls"
- Render `CallScheduleSettings` inside the new tab content

### 4. Update Hook Exports: `src/features/elevenlabs/hooks/index.ts`

- Export the new `useCallScheduleSettings` hook

## Files

| File | Action |
|------|--------|
| `src/features/elevenlabs/hooks/useCallScheduleSettings.ts` | Create -- query/mutation hook |
| `src/components/voice/CallScheduleSettings.tsx` | Create -- schedule management form |
| `src/pages/ElevenLabsAdmin.tsx` | Edit -- add Schedule tab |
| `src/features/elevenlabs/hooks/index.ts` | Edit -- export new hook |

