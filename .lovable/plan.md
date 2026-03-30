

# Auto-Update Conversation Data on Admin & Client Dashboards

## Problem
- The **Admin Dashboard** (ElevenLabsAdmin) already has realtime subscriptions on `elevenlabs_conversations` via `useElevenLabsConversations`, but the **Super Admin Command Center** (`/admin`) does not reflect conversation updates in real time.
- The **Client Portal Dashboard** has no voice conversation data or realtime subscriptions at all — clients cannot see inbound/outbound conversation activity for their agents.
- Neither the `useClientPortalAnalytics` nor `useSuperAdminDashboardData` hooks have `refetchInterval` or realtime subscriptions, so data goes stale until manual refresh.

## Plan

### 1. Add realtime auto-refresh to Super Admin Dashboard
**File:** `src/hooks/useSuperAdminDashboardData.tsx`
- Add `refetchInterval: 60_000` (60s polling) to the main metrics query so conversation counts stay current.
- Add a Supabase realtime subscription on `elevenlabs_conversations` table changes that invalidates the `super-admin-dashboard` query key.

### 2. Add Voice Conversations section to Client Portal Dashboard
**New file:** `src/features/dashboard/components/client-portal/VoiceConversationsSection.tsx`
- Create a new section showing recent inbound and outbound voice conversations for the client's agents.
- Query `elevenlabs_conversations` joined with `voice_agents` filtered by `client_id` (via the voice_agents table).
- Display a compact table: Date, Agent Name, Direction (inbound/outbound), Duration, Status.
- Show summary KPIs: total conversations, avg duration, completion rate.

### 3. Add realtime subscription to Client Portal voice conversations
**In the new VoiceConversationsSection:**
- Subscribe to `postgres_changes` on `elevenlabs_conversations` to auto-invalidate the query.
- Add `refetchInterval: 60_000` as a fallback.

### 4. Wire up the new section in ClientPortalDashboard
**File:** `src/features/dashboard/components/ClientPortalDashboard.tsx`
- Import and render `VoiceConversationsSection` between the Recent Applicants and Job Performance sections.
- Pass `activeClientId` so it scopes to the selected client.

### 5. Add auto-refresh to Client Portal analytics
**File:** `src/hooks/useClientPortalAnalytics.ts`
- Add `refetchInterval: 60_000` to keep pipeline/KPI data fresh as new applications arrive from voice conversations.

## Technical Details
- Realtime channels use `crypto.randomUUID()` for unique channel names (existing pattern).
- Voice agent → client mapping uses the `client_id` column on `voice_agents` table to scope conversations.
- All queries respect existing RLS policies; no migration needed.

