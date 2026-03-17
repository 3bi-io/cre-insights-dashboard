

# Remaining Production Refactoring — Plan

Two remaining items from the audit:

## Task 1: Migrate `console.log/error` → `createLogger()` in 7 functions

Each function gets a logger instance via `createLogger('function-name')` and replaces raw `console.*` calls:

| Function | Console calls | Notes |
|----------|--------------|-------|
| `verify-platform-secrets` | 1 error | Also needs CORS migration to `getCorsHeaders()` — still has hardcoded `corsHeaders` |
| `social-oauth-init` | 1 log, 1 error | Already uses `getCorsHeaders` |
| `organization-api` | 1 error | Has custom CORS (API key auth, intentional) — only add logger |
| `agent-scheduling` | ~10 calls | Already uses `getCorsHeaders`; also has `catch (error: any)` that needs `catch (error: unknown)` and several `any` types |
| `backfill-webhook` | 4 calls | Already uses `getCorsHeaders` and `getServiceClient` |
| `launch-social-beacons` | 2 errors | Has unused `createClient` import to remove |
| `generate-ad-creative` | 8 calls | Already uses `getCorsHeaders`; uses `serve()` from std — fine |

### Changes per function:
1. Add `import { createLogger } from '../_shared/logger.ts'` 
2. Create `const logger = createLogger('function-name')` 
3. Replace `console.log(...)` → `logger.info(...)` and `console.error(...)` → `logger.error(...)`
4. Fix any remaining `catch (error: any)` → `catch (error: unknown)`
5. `verify-platform-secrets`: migrate hardcoded CORS to `getCorsHeaders()`
6. `launch-social-beacons`: remove unused `createClient` import
7. `agent-scheduling`: type `any` params/variables where feasible

## Task 2: Consolidate 5 Hayes inbound functions into single parameterized function

Replace the 5 identical 3-line wrapper functions with a single `hayes-inbound` function that reads the client key from a query parameter:

1. Create `supabase/functions/hayes-inbound/index.ts` that reads `?client=danny-herman` (or similar) from the URL and calls `createClientHandler(HAYES_CLIENT_CONFIGS[client])`
2. Add `hayes-inbound` to `config.toml` with `verify_jwt = false`
3. Keep the 5 existing functions as-is for backward compatibility (they're already deployed and may have external integrations pointing to them) — but they could be simplified to redirect or kept as thin aliases

**Decision**: Keep existing 5 functions (external systems depend on their URLs) but add the unified endpoint as the canonical one going forward. No breaking changes.

## Task 3: Update `.lovable/plan.md` to mark everything complete

### Files to edit:
- 7 edge function `index.ts` files (logging migration)
- 1 new `hayes-inbound/index.ts` 
- `config.toml` (add hayes-inbound)
- `.lovable/plan.md`

