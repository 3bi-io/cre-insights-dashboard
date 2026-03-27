

## Best-in-Class AspenView Voice Agent Implementation Plan

### Current State Assessment

- **53 active job listings** across cybersecurity, engineering, and BPO roles
- **2 voice agents configured** but neither is operational:
  - "Aspenview Cybersecurity Recruiter" (inbound web + phone) -- no phone number assigned
  - "Aspenview Outbound Screener" (outbound phone) -- no phone number assigned
- **0 conversations, 0 outbound calls, 0 applications** recorded
- **All jobs route externally** to Rippling ATS via `apply_url`, which means `isExternalApply = true` on every AspenView job
- Voice Apply button is suppressed on every AspenView job because of the `!isExternalApply` guard
- Both agents use `gpt-4o-mini` -- under-powered for technical cybersecurity screening
- Call settings are configured (M-F 9-5 AST, 3 max attempts, smart scheduling on)

### Root Problems

1. **Voice Apply is invisible**: The `showVoiceButton={!isExternalApply}` logic hides the button for all AspenView jobs since they all have external Rippling `apply_url`s
2. **No phone numbers**: Neither agent has a Twilio number assigned, blocking all inbound and outbound calling
3. **No application capture**: With external-only apply, there is no local application record to trigger outbound screening calls
4. **Model under-powered**: `gpt-4o-mini` lacks the reasoning depth needed for technical cybersecurity role screening

### Implementation Plan

#### Phase 1: Enable Web Voice Apply for AspenView Jobs

**File: `src/pages/public/JobDetailsPage.tsx`**
- Change the voice button visibility logic to allow Voice Apply even when `isExternalApply` is true, specifically for AspenView jobs
- Logic: `showVoiceButton={!isMultiLocation && (!isExternalApply || isAspenViewJob(job.client_id))}`
- This lets candidates do an AI voice screening on the site, then still be routed to Rippling for formal application

**File: `src/features/jobs/components/public/JobSidebar.tsx`** (if needed)
- Ensure the sidebar renders the Voice Apply button when `showVoiceButton` is true alongside external apply links

**File: `src/components/public/StickyApplyCTA.tsx`** (if needed)
- Same: ensure mobile sticky CTA shows Voice Apply alongside the external apply button

#### Phase 2: Assign Twilio Phone Numbers

- Provision a dedicated Twilio local number for AspenView (avoid toll-free to prevent carrier blocking per A2P 10DLC requirements)
- Register the number with CNAM "AspenView Technology" in Twilio Console
- Update the `voice_agents` table to set `agent_phone_number_id` for both agents

**Database migration:**
```sql
-- After provisioning numbers in Twilio Console, update agent records
UPDATE voice_agents 
SET agent_phone_number_id = '<twilio_phone_number_sid>'
WHERE id = '219e2902-8c26-4adb-9200-1c3aca95b2e3'; -- Outbound Screener

UPDATE voice_agents 
SET agent_phone_number_id = '<twilio_phone_number_sid>'
WHERE id = '2c86588a-db3a-45d9-9ede-4bd3a30355ec'; -- Cybersecurity Recruiter
```

#### Phase 3: Upgrade LLM Model

**Database migration:**
```sql
UPDATE voice_agents 
SET llm_model = 'gpt-4o'
WHERE organization_id = '9335c64c-b793-4578-bf51-63d0c3b5d66d';
```

Note: The actual model is configured in the ElevenLabs dashboard per the architecture -- this DB field tracks it for display. The real change must be made in the ElevenLabs agent dashboard settings.

#### Phase 4: Create Local Application Records from Voice Sessions

**File: `supabase/functions/elevenlabs-conversation-webhook/index.ts`**
- After a completed voice session for an AspenView job, automatically create a local `applications` record with data extracted from the conversation transcript
- This enables the outbound screener to trigger follow-up calls and the dashboard to track candidates

**File: `supabase/functions/sync-voice-applications/index.ts`**
- Verify this existing function handles AspenView conversations correctly and creates application records that link back to the correct `job_listing_id`

#### Phase 5: Configure ElevenLabs Dashboard (Manual Steps)

These cannot be automated via code -- they require action in the ElevenLabs dashboard:

1. **Cybersecurity Recruiter agent prompt**: Set up dynamic variables for `candidate_name`, `job_title`, `company_name`, technical screening questions
2. **Outbound Screener agent prompt**: Configure follow-up screening flow with business hours context injection
3. **Upgrade both agents to GPT-4o** in the ElevenLabs model settings
4. **Configure webhook tools**: Point `check_availability`, `book_callback`, `get_next_slots` to the `agent-scheduling` edge function
5. **Set first_message_delay_ms** to 2000ms for the outbound agent to stabilize the Twilio-ElevenLabs handshake

#### Phase 6: Validate End-to-End Flow

```text
Candidate Journey:
1. Visits applyai.jobs/jobs → sees AspenView cybersecurity role
2. Clicks "Apply with Voice" → WebRTC connects to Cybersecurity Recruiter agent
3. Agent conducts 3-5 min technical screening (security clearance, certifications, experience)
4. Session ends → application record created → candidate directed to Rippling for formal apply
5. If voicemail/no-answer on outbound follow-up → SMS sent with Rippling link
6. Dashboard shows conversation transcript, scoring, and pipeline status
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/public/JobDetailsPage.tsx` | Allow Voice Apply for AspenView despite external apply URLs |
| `src/components/public/StickyApplyCTA.tsx` | Show Voice Apply alongside external apply on mobile |
| `src/features/jobs/components/public/JobSidebar.tsx` | Show Voice Apply alongside external apply in sidebar |
| Database migration | Assign phone numbers, upgrade LLM model field |

### Manual Configuration Required

| System | Action |
|--------|--------|
| Twilio Console | Provision local number, register CNAM, A2P 10DLC campaign |
| ElevenLabs Dashboard | Upgrade model to GPT-4o, configure prompts and dynamic variables, add webhook tools |
| Database | Update `agent_phone_number_id` after Twilio provisioning |

### Success Metrics

- Voice Apply button visible on all single-location AspenView jobs
- Inbound web voice sessions completing with transcript capture
- Outbound screening calls initiated for new applications
- Application records created and visible in dashboard
- Conversation transcripts stored for recruiter review

