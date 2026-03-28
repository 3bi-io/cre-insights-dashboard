

# Fix Voice Apply for Target Clients

## Current State
The code and database are **already working correctly** for all 7 clients. The `enrichJobs` function in `usePaginatedPublicJobs.tsx` and the agent lookup in `useJobDetails.tsx` both check client-specific agents first, then fall back to org-level agents. All 7 clients resolve to an active agent.

Werner, Hub Group, and TMC correctly do NOT show Voice Apply (their org has no agents).

## One Fix Needed

### `src/hooks/useJobDetails.tsx` — Stale type definition
Line 38-40 still declares `voiceAgent?: { global: boolean } | null` from the old platform-default era. The runtime value is `{ assigned: true }`. Update the interface to match:

```typescript
voiceAgent?: {
  assigned: boolean;
} | null;
```

This is a type-only fix. No behavioral change needed — all 7 clients already show Voice Apply correctly.

