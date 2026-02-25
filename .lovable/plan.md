

## Fix: Hub Group Zapier Webhook Not Firing

### Root Cause
The webhook for Career Now Brands / Hub Group (`https://hooks.zapier.com/hooks/catch/23823129/u28navp/`) has **never been triggered**. The `source_filter` field on the webhook record is an empty array `[]`, and the filtering logic in `submit-application/index.ts` treats empty arrays as "match nothing" instead of "match everything."

### The Bug (line 370-373 of `submit-application/index.ts`)
```text
const matchingWebhooks = (webhooks || []).filter((webhook) => {
  const sourceFilter = webhook.source_filter as string[] | null;
  if (!sourceFilter || sourceFilter.length === 0) return false;  // <-- BUG: empty = skip
  return sourceFilter.includes(source);
});
```

An empty `source_filter` should mean "no filter applied, match all sources." Currently it means "match no sources."

### Fix
**File: `supabase/functions/submit-application/index.ts`**

Change the filter logic so that `null` or empty `source_filter` means "match all sources":

```typescript
const matchingWebhooks = (webhooks || []).filter((webhook) => {
  const sourceFilter = webhook.source_filter as string[] | null;
  // Empty or null source_filter means "all sources" (no filter)
  if (!sourceFilter || sourceFilter.length === 0) return true;
  return sourceFilter.includes(source);
});
```

This single-line change (`return false` to `return true`) will cause all 8 existing Hub Group applications (and future ones) to trigger the Zapier webhook on submission.

### Additional Consideration
The webhook also needs to filter by `organization_id` -- currently `triggerSourceWebhooks` fetches ALL enabled webhooks across all organizations. This could cause cross-org webhook firing. However, the immediate fix above will unblock Hub Group. A follow-up improvement could scope the query to the application's organization.

### Scope of Change
- 1 line change in `supabase/functions/submit-application/index.ts`
- No database migrations needed
- No frontend changes needed

