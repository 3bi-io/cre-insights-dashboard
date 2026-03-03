

# Generate API Key for JobCast AI

## Organization Found
- **Name**: JobCast AI
- **ID**: `c0748904-8000-4971-9f04-5904d3b081dd`
- **No existing API keys** — need to create one

## What Needs to Happen

A single SQL insert into `org_api_keys`:

```sql
INSERT INTO org_api_keys (organization_id, label, allowed_origins)
VALUES (
  'c0748904-8000-4971-9f04-5904d3b081dd',
  'JobCast AI Production',
  ARRAY['https://jobcastai.com', 'https://www.jobcastai.com']
);
```

The `api_key` column auto-generates a 32-byte hex token via `encode(gen_random_bytes(32), 'hex')`. Rate limit defaults to 100 req/min.

## After Creation

The generated API key will be returned so you can share it with the JobCast AI team along with the integration prompt provided earlier.

