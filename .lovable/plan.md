

# Fix: Auto-sync Voice Agent Conversations & Date/Time Accuracy

## Problem
The `useElevenLabsConversations` hook fetches data once on mount and never refreshes automatically. There is:
1. **No Supabase Realtime subscription** on `elevenlabs_conversations`
2. **No polling interval** (`refetchInterval`) on the React Query
3. Users must hard-refresh to see new calls

## Solution

### 1. Add Realtime subscription + polling fallback in `useElevenLabsConversations.tsx`

- Subscribe to Supabase Realtime `postgres_changes` on `elevenlabs_conversations` table (INSERT, UPDATE, DELETE events)
- On any change, call `queryClient.invalidateQueries({ queryKey: ['elevenlabs-conversations'] })` to trigger a refetch
- Add `refetchInterval: 30000` (30s polling fallback) to the useQuery config, in case Realtime misses events
- Clean up the channel subscription on unmount via the `useEffect` return

### 2. Ensure correct date/time ordering

- The query already uses `.order('started_at', { ascending: false })` — newest first. This is correct.
- Verify that `ConversationHistoryTable.tsx` displays `started_at` using `format(new Date(conversation.started_at), 'MMM d, yyyy HH:mm')` which is already correct for local timezone rendering.
- No date bugs found — the existing `date-fns` `format()` calls correctly parse UTC strings and display in local time.

### Files to edit
- `src/features/elevenlabs/hooks/useElevenLabsConversations.tsx` — add `useEffect` with Realtime channel subscription + `refetchInterval: 30000`

### Technical detail

```typescript
// Add to useElevenLabsConversations hook:
useEffect(() => {
  const channel = supabase
    .channel('elevenlabs-conversations-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'elevenlabs_conversations',
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['elevenlabs-conversations'] });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [queryClient]);

// Add to useQuery config:
refetchInterval: 30_000,
```

This is a single-file change that adds both real-time updates (instant) and polling (30s fallback), eliminating the need for hard refreshes.

