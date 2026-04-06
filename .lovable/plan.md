

# Production Release Review: Relational Data Consistency & Best Practices

## Summary of Recent Changes
- X/Twitter handle updated from `applyai_jobs` to `applyai_x` (SEO, footer, structured data)
- `resolveTrackingLinkId` fixed to handle native JSONB arrays
- Zip code validation added to Double Nickel payload builder
- New `ats-retry` edge function created for admin retries

---

## Issues Found

### 1. CRITICAL — `ats-retry` Missing from `config.toml`

The new `ats-retry` function has **no entry** in `supabase/config.toml`. Without it, the default `verify_jwt = true` applies, but there is **no JWT/auth verification inside the function body** either. This means:
- Anyone with the anon key can invoke it and retry arbitrary applications to external ATS systems.
- It should either require JWT + admin role verification, or be set to `verify_jwt = false` with an internal admin secret check.

**Recommendation**: Add `[functions.ats-retry]` to `config.toml` with `verify_jwt = true`, and add `verifyUser` + `is_super_admin` check inside the function (matching the platform's standard security pattern). Alternatively, if it's only for build-time/CLI use, add an internal shared secret gate.

### 2. MODERATE — `ats-retry` Uses Inline CORS Instead of `getCorsHeaders()`

The platform standard (per production standards memory) is to use `getCorsHeaders()` from `_shared/cors-config.ts` with origin validation. The `ats-retry` function hardcodes `'Access-Control-Allow-Origin': '*'`, bypassing origin validation entirely.

**Recommendation**: Replace inline `corsHeaders` with `getCorsHeaders(req.headers.get('origin'))` and use `createPreflightResponse()` for OPTIONS.

### 3. MODERATE — `ats-retry` Missing Rate Limiting

All edge functions with write/mutation side effects should use the `RateLimiter` utility. `ats-retry` performs external API calls and database writes with no rate limiting.

**Recommendation**: Add rate limiting (e.g., 5 req/min) to prevent abuse or accidental repeated invocations.

### 4. LOW — `ats-retry` Sync Log Insert Does Not Check for Errors

Line 89-96: The `supabase.from('ats_sync_logs').insert(...)` result is not checked. Per Supabase/PostgREST constraints (from memory), mutation methods return `error` rather than throwing. A failed log insert would be silently swallowed.

**Recommendation**: Destructure `{ error }` and log if it fails — at minimum a `logger.warn()`.

### 5. LOW — `ats-retry` `increment_ats_sync_stats` RPC Not Error-Checked

Line 99-102: Same pattern — the RPC result is not inspected.

**Recommendation**: Add error handling to prevent silent stats drift.

### 6. LOW — `enrichWithTranscript` Return Type Mismatch in `ats-retry`

In `ats-retry/index.ts` line 83, `enrichWithTranscript` returns `Record<string, unknown>`, but it's passed directly to `adapter.sendApplication()` which expects `ApplicationData`. The `ats-integration` function and `auto-post-engine` both handle this with explicit casting. The retry function does assign to `ApplicationData` on line 80 but the enriched result on line 83 is not re-cast.

**Recommendation**: Cast the enriched result: `const enrichedData = await enrichWithTranscript(supabase, appData) as ApplicationData;` (matching `auto-post-engine` pattern).

### 7. INFO — Double Nickel Payload: Empty `companyId` Fallback

In `buildDoubleNickelPayload` (line 680), if neither `companyId` nor `company_id` exists in credentials, it sends `companyId: ''`. This may cause Double Nickel API rejections similar to the empty `trackingLinkId` bug that was just fixed.

**Recommendation**: Log a warning when `companyId` resolves to empty, or throw a validation error before sending.

---

## Files Requiring Changes

| File | Change | Priority |
|------|--------|----------|
| `supabase/config.toml` | Add `[functions.ats-retry]` with `verify_jwt = true` | Critical |
| `supabase/functions/ats-retry/index.ts` | Add admin auth check, use `getCorsHeaders()`, add rate limiting, check mutation errors, cast enriched data | Critical |
| `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` | Add warning log for empty `companyId` | Low |

## Implementation Steps

1. **Add `ats-retry` to `config.toml`** — single line: `[functions.ats-retry]\nverify_jwt = true`
2. **Harden `ats-retry` function**:
   - Import `getCorsHeaders`, `createPreflightResponse` from `_shared/cors-config.ts`
   - Import `verifyUser` or implement JWT + `is_super_admin` check
   - Add `RateLimiter` import and enforcement
   - Check `{ error }` on both `ats_sync_logs.insert()` and `increment_ats_sync_stats` RPC
   - Cast `enrichWithTranscript` result to `ApplicationData`
3. **Add empty `companyId` guard** in `buildDoubleNickelPayload` — log warning when it resolves to empty string

