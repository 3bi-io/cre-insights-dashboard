

# Plan: Enforce Double Nickel → R.E. Garrison Restriction End-to-End + Production Readiness

## Part 1: Double Nickel Client Restriction

### 1A. Database Constraint (Migration)

Add a validation trigger on `ats_connections` that prevents inserting or updating a row with `ats_system_id` pointing to the Double Nickel system unless `client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'` (R.E. Garrison).

We use a trigger (not a CHECK constraint) because the validation requires a join to `ats_systems` to resolve the slug. The trigger will:
- Look up the `ats_systems.slug` for the row's `ats_system_id`
- If slug = `'doublenickel'` and `client_id` is not `'be8b645e-d480-4c22-8e75-b09a7fc1db7a'`, raise an exception
- Fire on INSERT and UPDATE

```sql
CREATE OR REPLACE FUNCTION public.enforce_doublenickel_garrison_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug TEXT;
BEGIN
  SELECT slug INTO v_slug FROM ats_systems WHERE id = NEW.ats_system_id;
  IF v_slug = 'doublenickel' AND (NEW.client_id IS NULL OR NEW.client_id != 'be8b645e-d480-4c22-8e75-b09a7fc1db7a') THEN
    RAISE EXCEPTION 'Double Nickel connections are restricted to R.E. Garrison client only';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_enforce_doublenickel_garrison
  BEFORE INSERT OR UPDATE ON ats_connections
  FOR EACH ROW EXECUTE FUNCTION enforce_doublenickel_garrison_only();
```

### 1B. Runtime Guard in `auto-post-engine.ts`

Inside the connection processing loop (after line ~99), add a check: if `conn.ats_slug === 'doublenickel'` and `options?.clientId !== 'be8b645e-...'`, skip the connection with a logged error. This catches any mis-routed auto-post at runtime.

### 1C. Runtime Guard in `ats-retry/index.ts`

After fetching the connection and its system (line ~52), check if the system slug is `doublenickel` and the connection's `client_id` doesn't match Garrison. Return 403 with error if violated.

### 1D. Runtime Guard in `ats-integration/index.ts`

After the adapter is created (line ~120), add the same slug check before `send_application` is processed.

### 1E. Shared Constant

Add `DOUBLENICKEL_ALLOWED_CLIENT_ID` to a shared constants file (or inline it in each of the 3 files above) to avoid hardcoding the UUID in multiple places.

### 1F. Guard in `hayes-client-handler.ts`

The handler already passes `config.clientId` to `autoPostToATS`. The guard in 1B covers this. No additional change needed in the handler itself — the engine will reject non-Garrison clients.

---

## Part 2: Production Readiness Cleanup

### 2A. Fix `console.log` Leaks

| File | Issue | Fix |
|------|-------|-----|
| `supabase/functions/firecrawl-map/index.ts` | `console.log('Mapping URL:...')` | Replace with `logger.info()` |
| `supabase/functions/syndication-push/index.ts` | 2× `console.log(...)` | Replace with `logger.info()` |

The `_shared/logger.ts` using `console.log` internally is correct — that's the structured logging implementation.

### 2B. TODO Comment

| File | Issue | Action |
|------|-------|--------|
| `supabase/functions/tenstreet-extractcomplete/index.ts` | `// TODO: configure Tenstreet IP ranges` | Convert to a tracked comment with a ticket reference or remove if IP allowlisting is not planned |

### 2C. `ats-integration/index.ts` — Inline CORS

This function still uses hardcoded `corsHeaders` with `'*'` origin instead of `getCorsHeaders()`. Fix to match platform standard (same pattern as `ats-retry`).

### 2D. Production Build Verification

Run `npm run build` to confirm zero TypeScript errors and clean output.

---

## Files Changed (Summary)

| File | Change |
|------|--------|
| **New migration** | `enforce_doublenickel_garrison_only` trigger on `ats_connections` |
| `supabase/functions/_shared/ats-adapters/auto-post-engine.ts` | Add Double Nickel client guard in connection loop |
| `supabase/functions/ats-retry/index.ts` | Add Double Nickel client guard after connection fetch |
| `supabase/functions/ats-integration/index.ts` | Add Double Nickel client guard + fix inline CORS |
| `supabase/functions/firecrawl-map/index.ts` | Replace `console.log` with logger |
| `supabase/functions/syndication-push/index.ts` | Replace `console.log` with logger |
| `supabase/functions/tenstreet-extractcomplete/index.ts` | Clean up TODO comment |

