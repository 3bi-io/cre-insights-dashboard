

## Plan: Fix `resolveTrackingLinkId` to Handle Native JSON Arrays

### Problem
The `resolveTrackingLinkId` method (line 645) only checks `typeof rawIds === 'string'`. When `tracking_link_ids` is stored as a native JSON array (already parsed by Supabase's JSONB handling), the check fails and falls through to the legacy fallback, returning an empty string. Double Nickel rejects the empty `trackingLinkId` with "Invalid request body".

### Change

**File:** `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` (lines 642-658)

Update `resolveTrackingLinkId` to handle three cases:
1. **Already an array** — use first element directly
2. **JSON string** — parse and use first element (existing behavior)
3. **Plain string** — use as-is (existing behavior)
4. **Fallback** — legacy `trackingLinkId` / `tracking_link_id`

```typescript
private resolveTrackingLinkId(creds: Record<string, unknown>): string {
  const rawIds = creds.tracking_link_ids;
  if (rawIds) {
    // Already a parsed array (native JSONB)
    if (Array.isArray(rawIds) && rawIds.length > 0) {
      return String(rawIds[0]);
    }
    // JSON array string
    if (typeof rawIds === 'string') {
      try {
        const parsed = JSON.parse(rawIds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return String(parsed[0]);
        }
      } catch {
        return String(rawIds);
      }
    }
  }
  return String(creds.trackingLinkId || creds.tracking_link_id || '');
}
```

### Files changed (1)
- `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` — add `Array.isArray` check before the string check

