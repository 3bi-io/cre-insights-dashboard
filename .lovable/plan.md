
# Add Embed Form Outbound Voice Agent

## Context

You want all submissions from `/embed/apply` to trigger outbound calls via a specific ElevenLabs agent:

| Property | Value |
|----------|-------|
| **Agent ID** | `agent_3201kfp75kshfgwr1kfs310715z3` |
| **Phone Number ID** | `phnum_6901kg7vdsf5em2sh1cc1933d8j4` |

## Current Architecture Analysis

### Application Flow
```text
/embed/apply (iframe)
    ↓
useApplicationForm → submit-application edge function
    ↓
Database INSERT → trigger_application_insert_outbound_call()
    ↓
Creates record in outbound_calls table
```

### Current Trigger Logic (Priority Order)
1. **Client-specific agent** - Matches `client_id` from job listing
2. **Organization-level agent** - Matches `organization_id` with `client_id IS NULL`
3. **Platform default agent** - Falls back to `is_platform_default = true`

### The Gap
- Embed form applications currently get `source: 'Direct Application'` (same as regular `/apply`)
- No way to distinguish embed traffic for specialized routing
- Need to add a dedicated embed outbound agent as a new routing option

## Solution Overview

### Phase 1: Add Embed Source Tracking
Add `'Embed Form'` as a distinct source identifier so the system can recognize embed traffic.

### Phase 2: Insert Embed Outbound Agent
Add the new voice agent to the `voice_agents` table with the provided credentials.

### Phase 3: Update Database Trigger
Modify `trigger_application_insert_outbound_call()` to prioritize the embed agent when `source = 'Embed Form'`.

## Implementation Details

### 1. Update EmbedApply.tsx - Add Source Tracking

The embed form needs to pass a `source` field to identify its traffic:

```typescript
// In ApplicationForm submission for embed context
const formattedData = {
  ...data,
  source: 'Embed Form',  // NEW: Explicit source identifier
  // ... existing fields
};
```

### 2. Insert Voice Agent Record

Create a new migration to add the embed outbound agent:

```sql
INSERT INTO voice_agents (
  agent_name,
  agent_id,
  elevenlabs_agent_id,
  agent_phone_number_id,
  organization_id,      -- NULL for platform-wide
  client_id,            -- NULL for platform-wide
  is_active,
  is_outbound_enabled,
  is_platform_default,
  llm_model,
  description
) VALUES (
  'Outbound Agent - Embed Form',
  'agent_3201kfp75kshfgwr1kfs310715z3',
  'agent_3201kfp75kshfgwr1kfs310715z3',
  'phnum_6901kg7vdsf5em2sh1cc1933d8j4',
  NULL,  -- Platform-wide, not org-specific
  NULL,  -- No client association
  true,
  true,
  false, -- Not the platform default
  'gpt-4o-mini',
  'Dedicated outbound calling agent for embed form submissions'
);
```

### 3. Update Database Trigger Function

Modify `trigger_application_insert_outbound_call()` to check for embed source first:

```sql
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_client_id UUID;
  v_voice_agent_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND length(NEW.phone) >= 10 THEN
    
    -- PRIORITY 0: Embed Form submissions get dedicated agent
    IF NEW.source = 'Embed Form' THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE agent_id = 'agent_3201kfp75kshfgwr1kfs310715z3'
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
      
      IF v_voice_agent_id IS NOT NULL THEN
        INSERT INTO outbound_calls (
          application_id,
          voice_agent_id,
          organization_id,
          phone_number,
          status,
          metadata
        ) VALUES (
          NEW.id,
          v_voice_agent_id,
          NULL,  -- No org for embed
          NEW.phone,
          'queued',
          jsonb_build_object(
            'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
            'triggered_by', 'embed_form_submission',
            'source', 'Embed Form'
          )
        );
        RETURN NEW;
      END IF;
    END IF;
    
    -- EXISTING LOGIC: Client → Org → Platform default
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
    -- ... rest of existing logic unchanged
  END IF;
  
  RETURN NEW;
END;
$function$;
```

### 4. Update Submit-Application Edge Function

Add `'Embed Form'` detection based on referrer/origin:

```typescript
// Add to INTEGRATION_SIGNATURES
const INTEGRATION_SIGNATURES = {
  // ... existing entries
  'embed/apply': { source: 'Embed Form', requiresScreening: false },
};
```

Or pass source explicitly from the frontend.

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplicationForm.ts` | Pass `source: 'Embed Form'` when in embed context |
| `src/pages/EmbedApply.tsx` | Pass embed context to ApplicationForm |
| `supabase/migrations/[new].sql` | Insert voice agent + update trigger function |
| `supabase/functions/submit-application/index.ts` | Detect embed referrer as 'Embed Form' source |

## Alternative: Explicit Source Parameter

The cleanest approach is to pass `source` explicitly from the embed form:

**In EmbedApply or its form hook:**
```typescript
const formattedData = {
  ...data,
  source: 'Embed Form',  // Hardcoded for embed route
};
```

This avoids complex referrer detection and makes the intent explicit.

## Expected Behavior After Implementation

1. User fills out form on `/embed/apply` (embedded iframe)
2. Form submits with `source: 'Embed Form'`
3. Application inserted into database
4. Database trigger fires, detects `source = 'Embed Form'`
5. Trigger selects the dedicated embed agent (`agent_3201kfp75kshfgwr1kfs310715z3`)
6. Outbound call record created with `status: 'queued'`
7. ElevenLabs outbound call system picks up and dials from `phnum_6901kg7vdsf5em2sh1cc1933d8j4`

## Rollback Strategy

If issues arise:
1. Update the voice agent to `is_active = false`
2. Embed submissions will fall back to existing routing logic
