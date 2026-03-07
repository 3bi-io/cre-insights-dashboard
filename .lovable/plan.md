

## Randomize Job Listings Per Session

**Problem**: Jobs are always sorted by `created_at DESC` (most recent first). Every visitor sees the same order, which disadvantages older listings.

**Approach**: Generate a random seed once per browser session (`sessionStorage`), pass it to a Postgres function that shuffles results deterministically for that seed. This ensures:
- Same order within a session (pagination works correctly)
- Different order for each new session/visitor
- Only applies when `sortBy === 'recent'` (the default) — explicit sorts like "title" or "salary" remain deterministic

### Implementation

**1. Database function** (`supabase migration`):
Create a `get_random_jobs` Postgres function that uses `md5(id::text || seed)` as a deterministic shuffle key. It accepts filters (search, location, client), the seed, and pagination params. Returns jobs ordered by the hash.

```sql
CREATE OR REPLACE FUNCTION public.get_random_jobs(
  _seed text,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0,
  _search text DEFAULT '',
  _location text DEFAULT '',
  _client_id uuid DEFAULT NULL
)
RETURNS SETOF job_listings AS $$
  SELECT * FROM job_listings
  WHERE status = 'active' AND is_hidden = false
    AND (_search = '' OR title ILIKE '%' || _search || '%' OR job_title ILIKE '%' || _search || '%')
    AND (_location = '' OR city ILIKE '%' || _location || '%' OR state ILIKE '%' || _location || '%')
    AND (_client_id IS NULL OR client_id = _client_id)
  ORDER BY md5(id::text || _seed)
  LIMIT _limit OFFSET _offset;
$$
LANGUAGE sql STABLE SECURITY DEFINER;
```

**2. Session seed** (`usePaginatedPublicJobs.tsx`):
- Generate a random seed on mount: `sessionStorage.getItem('job_seed') || crypto.randomUUID()`
- Store in `sessionStorage` so it persists across navigations but resets on new tab/session
- When `sortBy === 'recent'` (default), call `supabase.rpc('get_random_jobs', { _seed, _limit, _offset, ... })` instead of the regular query
- When user explicitly sorts by title/salary, use the existing `.order()` query as-is

**3. Add "random" as default sort option**:
- Rename the default sort from `'recent'` to `'random'` in the UI, or keep `'recent'` label but apply random logic under the hood
- Option: add a visible "Shuffle" sort option so users understand the randomization

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **DB function with seed** (recommended) | Consistent pagination, server-side, performant | Requires migration |
| Client-side shuffle | No migration | Breaks pagination, only shuffles loaded page |
| `ORDER BY random()` | Simple | Different order on every page load, breaks pagination |

**Files affected**: 1 migration, `usePaginatedPublicJobs.tsx`, `usePublicJobsPage.ts` (seed generation)

