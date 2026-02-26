

## Fix: Return `hasVoiceAgent: true` for Embed Form Submissions

### Root Cause

The `submit-application` edge function checks for outbound voice agents at lines 1132-1139:

```typescript
const { data: voiceAgent } = await supabase
  .from('voice_agents')
  .select('id')
  .eq('organization_id', organizationId)
  .eq('is_active', true)
  .eq('is_outbound_enabled', true)
  .maybeSingle();
```

**Problem:** Hayes Recruiting (org `84214b48-...`) has **4 active outbound agents** (Pemberton, Day & Ross, Danny Herman, James Burg). The `.maybeSingle()` call **errors when multiple rows are returned**, causing `voiceAgent` to be `null` and `hasVoiceAgent` to resolve to `false`.

Meanwhile, the actual outbound call routing for embed submissions is handled by a database trigger using a hardcoded agent ID -- so calls DO happen, but the thank-you page never shows the phone screening notice.

### Fix

**File: `supabase/functions/submit-application/index.ts`** (lines ~1132-1139)

Replace the `.maybeSingle()` query with `.limit(1).maybeSingle()` so that when multiple outbound agents exist, we still get a truthy result. Alternatively, for Embed Form submissions specifically, we can short-circuit and set `hasVoiceAgent: true` since we know the DB trigger will always route those to the hardcoded embed agent.

**Recommended approach -- both fixes combined:**

1. Change the voice agent query from `.maybeSingle()` to `.limit(1).maybeSingle()` -- this fixes the general case for any org with multiple outbound agents.
2. Add a source-based override: if `formData.source === 'Embed Form'`, force `hasVoiceAgent = true` since the DB trigger guarantees an outbound call for these submissions.

```typescript
// For embed submissions, we know the DB trigger routes to a dedicated agent
const isEmbedForm = formData.source === 'Embed Form';

let hasVoiceAgent = isEmbedForm;

if (!hasVoiceAgent) {
  const { data: voiceAgent } = await supabase
    .from('voice_agents')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('is_outbound_enabled', true)
    .limit(1)
    .maybeSingle();
  
  hasVoiceAgent = !!voiceAgent;
}
```

### Result

After this fix, when an applicant submits via `/embed/apply`:
- The response will include `hasVoiceAgent: true`
- The `EmbedThankYou` component will display: "You may receive a call from our AI assistant for a brief phone screening"
- No changes needed to any frontend code

### Technical Details

- **Edge function to redeploy:** `submit-application`
- Only ~8 lines of code change in the response section
- The `.limit(1)` addition also prevents the same bug for any future organization with multiple outbound agents using the standard `/apply` form

