

# Activate James Burg Outbound Agent

## What

Update the "Outbound Agent - James Burg Trucking" voice agent with the provided ElevenLabs agent ID and reactivate it.

## Current State

- Agent ID: `23981299-ce34-47a3-9646-45bc09dba6f8`
- ElevenLabs Agent ID: NULL
- Active: false

## Change

Single SQL migration:

```sql
UPDATE voice_agents 
SET elevenlabs_agent_id = 'agent_1001khcae0z0fsx8r9r9gttr300x', 
    is_active = true 
WHERE id = '23981299-ce34-47a3-9646-45bc09dba6f8';
```

This will allow the outbound call pipeline to successfully initiate calls for James Burg Trucking applicants via the cron job.

