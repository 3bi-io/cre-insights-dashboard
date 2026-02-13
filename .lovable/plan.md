

# Add James Burg Trucking Outbound Voice Agent

## What This Does

Creates an outbound voice agent for James Burg Trucking Company so that every application received for James Burg jobs will automatically trigger an outbound call to the candidate.

## How It Works (Already Built)

The database trigger `trigger_application_insert_outbound_call` already implements client-aware routing:

1. When an application is submitted with a phone number, the trigger fires
2. It looks up the `client_id` from the job listing
3. **Priority 1**: Finds a voice agent matching that `client_id` with outbound enabled
4. If found, queues an outbound call automatically

Since James Burg Trucking's `client_id` is `b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`, we just need to insert the agent record and the routing will work automatically.

## Change Required

**Insert one record into `voice_agents` table:**

| Field | Value |
|---|---|
| agent_name | Outbound Agent - James Burg Trucking |
| agent_id | agent_1001khcae0z0fsx8r9r9gttr300x |
| organization_id | 84214b48-7b51-45bc-ad7f-723bcf50466c (Hayes Recruiting Solutions) |
| client_id | b2a29507-32a6-4f5e-85d6-a7e6ffac3c52 (James Burg Trucking) |
| agent_phone_number_id | phnum_5301khcb0877fkpt3t3e57qd0gba |
| is_outbound_enabled | true |
| is_active | true |
| is_platform_default | false |

No code changes or edge function updates needed. The existing trigger and outbound call infrastructure handle everything.

## Verification

After insertion, any new application submitted to a James Burg Trucking job listing with a valid phone number will automatically queue an outbound call using this agent.
