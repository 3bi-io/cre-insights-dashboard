

## AspenView Voice Agent Final Configuration

### Current State
- Both agents already upgraded to **gpt-4o** (previous migration applied successfully)
- Neither agent has a phone number assigned (`agent_phone_number_id = NULL`)
- Cybersecurity Recruiter has no description

### Step 1: Assign Phone Numbers (data update)

Using the insert/update tool (not a migration, since this is data):

```sql
-- Inbound: Cybersecurity Recruiter
UPDATE voice_agents 
SET agent_phone_number_id = 'phnum_5601kg7vfxvbfe6bt08gd4hkm5wn'
WHERE id = '2c86588a-db3a-45d9-9ede-4bd3a30355ec';

-- Outbound: Outbound Screener
UPDATE voice_agents 
SET agent_phone_number_id = 'phnum_01jz3x3nm8ex6rx09hmf3fr1ht'
WHERE id = '219e2902-8c26-4adb-9200-1c3aca95b2e3';
```

### Step 2: Add Description to Cybersecurity Recruiter (data update)

```sql
UPDATE voice_agents 
SET description = 'Inbound voice screening agent for AspenView Technology Partners. Conducts technical cybersecurity screening interviews via web and phone, evaluating candidates on security clearances, certifications (CISSP, CEH, CompTIA Security+), and relevant experience before routing to Rippling ATS for formal application.'
WHERE id = '2c86588a-db3a-45d9-9ede-4bd3a30355ec';
```

### Step 3: Verify End-to-End

After the data updates, verify:

1. **Database** — Query `voice_agents` to confirm both `agent_phone_number_id` values are set and description is populated
2. **Frontend** — Load an AspenView job on the public site (`/jobs?client=82513316-...`) and confirm the "Apply with Voice" button is visible (the code change from the previous implementation should show it despite `isExternalApply`)
3. **Voice session** — Confirm the WebRTC connection initializes when clicking "Apply with Voice" on an AspenView job
4. **Outbound trigger** — Confirm the `trigger_application_insert_outbound_call` function now finds the outbound agent (since `agent_phone_number_id` is no longer NULL, the priority-1 client-specific match will succeed)

### Files to Change
None — these are all data updates to the `voice_agents` table using the insert/update tool.

### What Was Already Done
- LLM model upgraded to `gpt-4o` (migration `20260327234743`)
- Voice Apply button visibility fixed for AspenView jobs in `JobDetailsPage.tsx`
- Webhook updated to capture `job_listing_id` from metadata

