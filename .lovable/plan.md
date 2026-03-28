

# Fix: Voice Apply CTA Not Showing on Public /jobs Page

## Problem Found

The `voice_agents` table has RLS that restricts reads to **authenticated users only** (migration `20260123204659`). The public `/jobs` page queries voice_agents with the anon key, which returns `[]` for every request. This means **no client shows Voice Apply on the public page** — not even Danny Herman, Aspenview, or any enabled client.

The code changes from the previous edit (client-only filtering logic) are correct, but they have no effect because the underlying data query returns nothing.

## Fix

### Step 1: Create a security definer function for public voice agent lookup

Create a new SQL function `get_public_voice_agent_client_ids` that:
- Runs as `SECURITY DEFINER` (bypasses RLS)
- Takes an array of organization IDs
- Returns only `organization_id` and `client_id` for active agents with a non-null `client_id`
- Exposes no sensitive data (no agent IDs, credentials, phone numbers)

```sql
CREATE OR REPLACE FUNCTION public.get_public_voice_agent_client_ids(_org_ids uuid[])
RETURNS TABLE(organization_id uuid, client_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT va.organization_id, va.client_id
  FROM public.voice_agents va
  WHERE va.organization_id = ANY(_org_ids)
    AND va.is_active = true
    AND va.client_id IS NOT NULL;
$$;
```

### Step 2: Update `usePaginatedPublicJobs.tsx` enrichJobs function

Replace the direct `.from('voice_agents').select(...)` query with an RPC call:

```ts
const { data: agentData } = await supabase.rpc('get_public_voice_agent_client_ids', {
  _org_ids: orgIds
});
```

Then build agentKeys from the result as before.

### Step 3: Update `useJobDetails.tsx`

Replace the direct voice_agents query with the same RPC, or a simpler single-row check:

```ts
const { data: agentCheck } = await supabase.rpc('get_public_voice_agent_client_ids', {
  _org_ids: [data.organization_id]
});
const hasClientAgent = agentCheck?.some(a => a.client_id === data.client_id);
```

## Result

After this fix:
- **Enabled clients** (Aspenview, Danny Herman, Day & Ross, James Burg, Novco, Pemberton, R.E. Garrison, Sysco) will show Voice Apply CTA
- **Disabled clients** (Dollar Tree, Family Dollar, Hayes AI Recruiting, Hub Group, Kroger, TMC, Werner) will NOT show Voice Apply CTA
- No sensitive agent data is exposed to public visitors

