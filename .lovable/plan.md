

## Calendar Integration: Client-Level Multi-Recruiter Support

### Problems Identified

1. **Calendar connect isn't working** — The current `recruiter_calendar_connections` table has a `UNIQUE(user_id, provider)` constraint, meaning each user can only have one connection. The OAuth flow works but the upsert may silently fail or overwrite. Additionally, the current UI in the Schedule tab (`RecruiterCalendarConnect`) only shows connections for the logged-in admin user, not organized by client.

2. **No client association** — The `recruiter_calendar_connections` table has no `client_id` column. Connections are tied to individual auth users, so the AI agent picks the first available recruiter for the entire org (line 137 of `agent-scheduling`), ignoring which client the applicant belongs to.

3. **No multi-recruiter per client** — Each client may have multiple recruiters, but there's no way to associate multiple calendar connections to a single client and round-robin or load-balance between them.

### Architecture Changes

#### 1. Database Migration

Add `client_id` to `recruiter_calendar_connections`:

```sql
ALTER TABLE public.recruiter_calendar_connections 
  ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Drop old unique constraint (one connection per user+provider)
ALTER TABLE public.recruiter_calendar_connections 
  DROP CONSTRAINT recruiter_calendar_connections_user_id_provider_key;

-- New unique: one connection per user+provider+client
ALTER TABLE public.recruiter_calendar_connections 
  ADD CONSTRAINT unique_user_provider_client 
  UNIQUE(user_id, provider, client_id);

-- Index for client-level lookups
CREATE INDEX idx_calendar_connections_client 
  ON public.recruiter_calendar_connections(client_id);

-- Update RLS: org admins can view all connections in their org
CREATE POLICY "Admins can view org calendar connections"
  ON public.recruiter_calendar_connections FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = public.get_user_organization_id()
  );
```

#### 2. Edge Function: `calendar-integration`

- **`oauth_url`**: Accept optional `client_id` parameter, pass it through OAuth `state` (encode as JSON: `{userId, clientId}`)
- **`oauth_callback`**: Parse state to extract `client_id`, store it on the connection record
- **`list_connections`**: For admins, support optional `client_id` filter to list all connections for a client. Also support `organization_id` filter to list all org connections grouped by client.

#### 3. Edge Function: `agent-scheduling`

Update `handleCheckAvailability` to:
- Accept optional `client_id` parameter
- Look up the application's `client_id` from the job listing if not provided
- Query `recruiter_calendar_connections` filtered by `client_id` (not just org)
- If multiple recruiters have connections for that client, check availability across all of them and pick the one with the earliest open slot (round-robin/first-available)

#### 4. Frontend: Admin Schedule Tab

Replace the current `RecruiterCalendarConnect` component with a **Client Calendar Management** UI:

- **Client selector dropdown** — Pick a client from the org's client list
- **Per-client connection list** — Show all recruiter calendar connections for the selected client
- **Add recruiter calendar** — Button to initiate OAuth flow with `client_id` attached
- **Connection cards** — Show recruiter email, provider, connected date, with disconnect button
- **Empty state** — "No calendars connected for this client" with connect button

This replaces the single-user-centric view with a client-centric management panel.

#### 5. Frontend: Recruiter Self-Service (`/my-calendar`)

Keep the existing self-service page but enhance it:
- Show which client(s) each connection is associated with
- Allow recruiter to connect calendar for a specific client assignment

### Data Flow After Changes

```text
Application submitted for Client X
  → AI agent gets client_id from job_listing
  → agent-scheduling: check_availability(org_id, client_id)
  → Finds all recruiter_calendar_connections WHERE client_id = X
  → Checks availability across all connected recruiters
  → Picks first available slot from any recruiter
  → Books on that recruiter's calendar
```

### Files to Create/Modify

| File | Change |
|------|--------|
| **Migration SQL** | Add `client_id` column, update unique constraint, add RLS policy |
| `supabase/functions/calendar-integration/index.ts` | Add `client_id` to OAuth flow state, callback storage, list filtering |
| `supabase/functions/agent-scheduling/index.ts` | Filter connections by `client_id`, multi-recruiter availability check |
| `src/components/voice/RecruiterCalendarConnect.tsx` | Rewrite as client-centric calendar management with client selector |
| `src/pages/RecruiterCalendarPage.tsx` | Show client associations on connections |

### Impact

- Existing connections (no `client_id`) will still work as org-level fallbacks
- The agent-scheduling function will prefer client-specific connections, falling back to org-level ones
- No breaking changes to the ElevenLabs webhook tool configuration

