

# Complete Voice Agent Configuration & Applicant Data Flow Fix

## Executive Summary

This plan addresses **3 critical issues** identified in the ElevenLabs voice agent audit:

1. **Missing Phone Number IDs** - 2 outbound agents cannot initiate calls
2. **Broken Client-Specific Routing** - All Hayes applications route to a single agent
3. **Complete Audit & Verification** - All 9 active agents reviewed and validated

---

## Current State: All 9 Active Voice Agents

| Agent Name | Type | Organization | Client | Has Phone ID | Status |
|------------|------|--------------|--------|--------------|--------|
| Inbound Agent - CR England | Inbound | CR England | (org-level) | ✅ phnum_01jz3x... | OK |
| Inbound Agent - Danny Herman | Inbound | Hayes | Danny Herman | ✅ phnum_7101k9... | OK |
| Inbound Agent - Day & Ross | Inbound | Hayes | Day and Ross | ✅ phnum_7401k9... | OK |
| Inbound Agent - Global | Inbound | Hayes | (org-level) | ✅ phnum_3801k1... | OK |
| Inbound Agent - Hayes | Inbound | Hayes | (org-level) | ✅ phnum_5501k9... | OK |
| Inbound Agent - Pemberton | Inbound | Hayes | Pemberton | ✅ phnum_9501k9... | OK |
| **Outbound Agent - Danny Herman** | Outbound | Hayes | Danny Herman | ❌ **MISSING** | **BLOCKED** |
| Outbound Agent - Day & Ross | Outbound | Hayes | Day and Ross | ✅ phnum_3501k9... | OK |
| **Outbound Agent - Pemberton** | Outbound | Hayes | Pemberton | ❌ **MISSING** | **BLOCKED** |

---

## Issue #1: Missing Phone Number IDs (BLOCKING)

### Impact
The Danny Herman and Pemberton outbound agents **cannot initiate any calls** because they are missing `agent_phone_number_id`. Both the database trigger and edge function require this field.

### Resolution Required
You need to provide ElevenLabs phone number IDs for these agents. Once provided, I will update the database:

```sql
-- Add phone number IDs (awaiting values from user)
UPDATE public.voice_agents
SET agent_phone_number_id = 'phnum_XXXXX_danny_herman'
WHERE agent_id = 'agent_1501kfp6wq37e0vrcear1vebcbdg';

UPDATE public.voice_agents
SET agent_phone_number_id = 'phnum_XXXXX_pemberton'
WHERE agent_id = 'agent_0101kfp6waxpezy8r56ewhx8eqya';
```

---

## Issue #2: Broken Client-Specific Outbound Routing

### Current Problem
The database trigger `trigger_application_insert_outbound_call` routes ALL Hayes Recruiting applications to the Day & Ross outbound agent because:
- It only filters by `organization_id`
- It picks the first agent it finds with a valid phone number
- Day & Ross is currently the only Hayes outbound agent with a phone number configured

### Current Trigger Logic (Simplified)
```sql
-- CURRENT: Only checks organization_id
SELECT id INTO v_voice_agent_id
FROM voice_agents
WHERE organization_id = v_org_id
  AND is_outbound_enabled = true
  AND agent_phone_number_id IS NOT NULL
  AND is_active = true
LIMIT 1;  -- Gets Day & Ross every time
```

### Proposed Fix
Update both trigger functions to prefer client-specific agents:

```sql
CREATE OR REPLACE FUNCTION public.trigger_application_insert_outbound_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_client_id UUID;  -- NEW: Track client ID
  v_voice_agent_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    -- Get organization ID AND client ID from job listing
    SELECT jl.organization_id, jl.client_id INTO v_org_id, v_client_id
    FROM job_listings jl
    WHERE jl.id = NEW.job_listing_id;
    
    -- FIXED: Prefer client-specific agent, then fall back to org-level
    SELECT id INTO v_voice_agent_id
    FROM voice_agents
    WHERE organization_id = v_org_id
      AND is_outbound_enabled = true
      AND agent_phone_number_id IS NOT NULL
      AND is_active = true
      AND (client_id = v_client_id OR client_id IS NULL)
    ORDER BY client_id NULLS LAST  -- Client-specific agents first
    LIMIT 1;
    
    -- Platform default fallback (unchanged)
    IF v_voice_agent_id IS NULL THEN
      SELECT id INTO v_voice_agent_id
      FROM voice_agents
      WHERE is_platform_default = true
        AND is_outbound_enabled = true
        AND agent_phone_number_id IS NOT NULL
        AND is_active = true
      LIMIT 1;
    END IF;
    
    IF v_voice_agent_id IS NOT NULL THEN
      INSERT INTO outbound_calls (
        application_id, voice_agent_id, organization_id,
        phone_number, status, metadata
      ) VALUES (
        NEW.id, v_voice_agent_id, v_org_id, NEW.phone, 'queued',
        jsonb_build_object(
          'applicant_name', COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
          'triggered_by', 'application_submission',
          'source', COALESCE(NEW.source, 'unknown'),
          'client_id', v_client_id  -- NEW: Track client for debugging
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

The same fix applies to `trigger_follow_up_outbound_call`.

---

## Issue #3: Edge Function Routing (Secondary)

### Current Behavior
The edge function (`elevenlabs-outbound-call`) also has org-level-only routing when finding a voice agent dynamically:

```typescript
// Current: Only checks organization_id
const { data: voiceAgent } = await supabase
  .from('voice_agents')
  .select('id')
  .eq('organization_id', organizationId)
  .eq('is_outbound_enabled', true)
  .eq('is_active', true)
  .not('agent_phone_number_id', 'is', null)
  .limit(1)
  .single();
```

### Proposed Fix
Add client_id awareness to the edge function:

```typescript
// Get client_id from job listing
let clientId: string | null = null;
if (jobListing?.client_id) {
  clientId = jobListing.client_id as string;
}

// Prefer client-specific agent
let voiceAgentQuery = supabase
  .from('voice_agents')
  .select('id')
  .eq('organization_id', organizationId)
  .eq('is_outbound_enabled', true)
  .eq('is_active', true)
  .not('agent_phone_number_id', 'is', null);

if (clientId) {
  // Try client-specific first
  const { data: clientAgent } = await voiceAgentQuery
    .eq('client_id', clientId)
    .limit(1)
    .single();
  
  if (clientAgent) {
    voiceAgentId = clientAgent.id;
  }
}

// Fallback to org-level if no client match
if (!voiceAgentId) {
  const { data: orgAgent } = await voiceAgentQuery
    .is('client_id', null)
    .limit(1)
    .single();
  voiceAgentId = orgAgent?.id;
}
```

---

## Applicant Data Flow: Confirmed Working ✅

The edge function correctly maps comprehensive applicant data to ElevenLabs dynamic variables:

### Data Passed to Voice Agents
| Category | Variables |
|----------|-----------|
| **Applicant Identity** | `applicant_first_name`, `applicant_last_name`, `applicant_full_name` |
| **Location** | `applicant_location`, `applicant_zip` |
| **CDL Status** | `applicant_cdl_status`, `has_cdl`, `applicant_endorsements` |
| **Experience** | `applicant_experience` |
| **Qualifications** | `over_21_status`, `drug_test_status`, `physical_status`, `veteran_status` |
| **Job Context** | `job_title`, `job_type`, `job_location`, `experience_required`, `salary_range` |
| **Company** | `company_name`, `company_description` |
| **Job Requirements** | `job_requires_cdl`, `job_cdl_class`, `job_requires_hazmat`, `job_requires_tanker`, `job_is_entry_level`, `job_is_local`, `job_is_otr`, `job_is_team`, `job_freight_type` |

**All inbound agents have phone IDs configured and can receive calls with full applicant context.**

---

## Job Listings by Client

| Client | Active Jobs | Outbound Agent Status |
|--------|-------------|----------------------|
| Danny Herman Trucking | 127 | ❌ Blocked (no phone ID) |
| Day and Ross | 46 | ✅ Working |
| Pemberton Truck Lines Inc | 81 | ❌ Blocked (no phone ID) |

---

## Implementation Steps

### Step 1: Collect Missing Phone IDs
**Action Required**: Provide ElevenLabs phone number IDs for:
- Outbound Agent - Danny Herman
- Outbound Agent - Pemberton

### Step 2: Database Migration
Once phone IDs are provided, create a single migration that:
1. Updates Danny Herman outbound agent with phone ID
2. Updates Pemberton outbound agent with phone ID
3. Replaces `trigger_application_insert_outbound_call` with client-aware routing
4. Replaces `trigger_follow_up_outbound_call` with client-aware routing

### Step 3: Edge Function Update
Update `supabase/functions/elevenlabs-outbound-call/index.ts` to:
1. Fetch `client_id` from job listing
2. Prefer client-specific agents when routing

### Step 4: Verification
1. Query voice_agents to confirm all phone IDs are set
2. Test application submission for each client
3. Verify correct agent is selected in outbound_calls metadata
4. Check ElevenLabs logs for proper dynamic variable delivery

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add phone IDs + update trigger functions |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Add client_id routing preference |

**Awaiting**: ElevenLabs phone number IDs for Danny Herman and Pemberton outbound agents.

