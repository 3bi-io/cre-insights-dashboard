

# Platform Audit Report — Full Status & Recommendations

---

## 1. EDGE FUNCTIONS (104 functions)

### 1A. `@ts-nocheck` Still Present (19 functions) — HIGH PRIORITY
These bypass TypeScript safety. 5 security-critical ones were already fixed; 14 remain:

| Function | Risk |
|----------|------|
| `outbound-webhook` | Sends external data |
| `domain-configuration` | Admin config |
| `sync-rippling-feeds` | Data sync |
| `sync-cdl-feeds` | Data sync |
| `meta-adset-report` | Financial data |
| `meta-spend-analytics` | Financial data |
| `craigslist-integration` | External posting |
| `indeed-xml-feed` | Public feed |
| `meta-leads-cron` | Automated cron |
| `talroo-integration` | External API |
| `fetch-crengland-jobs` | Data sync |
| `fetch-application-feeds` | Data sync |
| `job-feed-xml` | Public feed |
| `meta-sync-cron` | Automated cron |
| `chatbot-analytics` | Analytics |
| `data-analysis` | AI + data |
| `trucking-platform-integration` | External API |
| `google-indexing` | SEO |
| `_shared/application-processor.ts` | Core processing |

**Recommendation**: Remove `@ts-nocheck` in priority order: `application-processor.ts` (shared, affects many functions), `outbound-webhook`, `domain-configuration`, then the rest. Add proper types, typed catch blocks, and `EdgeRuntime` declarations as was done for the 5 already completed.

### 1B. CORS Migration Status — MEDIUM PRIORITY
- **Migrated to `getCorsHeaders()`**: ~27 functions
- **Still using hardcoded `corsHeaders = { "Access-Control-Allow-Origin": "*" }`**: 11 functions (`send-application-email`, `admin-update-password`, `auth-email-templates`, `email-unsubscribe`, `send-test-emails`, `generate-founders-pass-creative`, `generate-ad-creative`, `background-check`, `background-check-webhook`, `send-magic-link`, `send-invite-email`)
- **Still using `corsHeaders` import from deprecated cors.ts**: 0 (good — all deprecated imports cleared)

**Recommendation**: Migrate the 11 remaining hardcoded CORS functions to `getCorsHeaders()`. Prioritize `send-application-email` and `admin-update-password` (authenticated, sensitive).

### 1C. SDK Version Pinning — MEDIUM PRIORITY
- **Pinned to `@2.50.0`**: ~20 functions
- **Unpinned `@supabase/supabase-js@2`** (floats to latest): ~48 functions including `elevenlabs-outbound-call`, `_shared/supabase-client.ts`, `_shared/auth.ts`, `social-oauth-callback`, `inbound-applications`, `background-check-webhook`, `generate-image`, etc.

**Recommendation**: Pin `_shared/supabase-client.ts` and `_shared/auth.ts` first (they're imported by 27+ functions via `getServiceClient`). Then batch-pin the remaining 48.

### 1D. `createClient()` vs `getServiceClient()` — MEDIUM PRIORITY
- **Using `getServiceClient()`**: 27 functions (good)
- **Using manual `createClient(Deno.env.get(...))`**: ~40+ functions

**Recommendation**: Migrate the remaining ~40 to `getServiceClient()`. This centralizes env-var validation and ensures consistent error handling.

### 1E. `console.log/error` vs `createLogger()` — LOW PRIORITY
- **Using raw `console.*`**: 22 functions (`generate-founders-pass-creative`, `firecrawl-crawl`, `firecrawl-job-import`, `generate-og-images`, `resolve-embed-token`, `social-oauth-callback`, plus shared files)
- **Using `createLogger()`**: majority

**Recommendation**: Replace in batches. Prioritize `resolve-embed-token` and `social-oauth-callback` (user-facing).

### 1F. Missing `config.toml` Entries — HIGH PRIORITY
5 Hayes inbound functions exist as deployed edge functions but are **not listed in `config.toml`**:
- `hayes-danny-herman-inbound`
- `hayes-dayross-inbound`
- `hayes-jamesburg-inbound`
- `hayes-novco-inbound`
- `hayes-pemberton-inbound`

**Recommendation**: Add all 5 to `config.toml` with `verify_jwt = false` (they're public inbound endpoints). Then consolidate into a single parameterized function as planned in #10.

### 1G. Hayes Function Consolidation — LOW PRIORITY
All 5 Hayes functions are identical 3-line wrappers calling `createClientHandler(HAYES_CLIENT_CONFIGS['xxx'])`. They can be replaced by a single `hayes-inbound` function that reads the client name from a query parameter or path.

---

## 2. FRONTEND ARCHITECTURE

### 2A. Feature Module Structure — GOOD
Well-organized feature modules: `admin`, `ai-analytics`, `ai-chat`, `ai-tools`, `analytics`, `applications`, `ats`, `auth`, `campaigns`, `candidate`, `clients`, `dashboard`, `demo`, `elevenlabs`, `feeds`, `job-groups`, `jobs`, `landing`, `organizations`, `platforms`, `routes`, `screening`, `settings`, `shared`, `social-engagement`, `talent`, `tenstreet`. Each has barrel exports.

### 2B. Routing — GOOD with minor issues
- 341-line `AppRoutes.tsx` with proper lazy loading via `React.lazy` and `Suspense`
- Legacy redirects maintained for backward compatibility
- `ProtectedRoute` includes 15s timeout protection (good)
- **Issue**: Admin routes (`/admin/*`) wrap each child in `ProtectedRouteWrapper` which nests `ProtectedRoute` inside the parent `LayoutWrapper` that already has `ProtectedRoute`. This double-wraps auth checks — unnecessary but not harmful. Could simplify by removing the inner `ProtectedRouteWrapper` since the parent layout already enforces auth.

### 2C. Auth System — GOOD
- Uses `get_current_user_role` RPC (server-side, not reading from profiles table)
- Role validation against allowlist (`VALID_ROLES`)
- Retry logic with timeout for transient failures
- Auth state cleanup on startup (`cleanupCorruptedAuthState`)
- **No client-side role storage** (correct per security guidelines)

### 2D. Dialog Accessibility Warning — LOW PRIORITY
Console shows: `Missing Description or aria-describedby for DialogContent`. Several dialogs across the app use `DialogContent` without `DialogDescription`. The `dialog.tsx` component doesn't auto-inject a hidden description.

**Recommendation**: Add `<DialogDescription className="sr-only">...</DialogDescription>` to dialogs that don't need visible descriptions, or add `aria-describedby={undefined}` to suppress the warning intentionally.

### 2E. Global State & Data Fetching — GOOD
- `QueryClient` with proper stale time (5 min), gc time (10 min), no retry on 4xx
- `FeatureProvider` for feature gating
- `GeoBlockingProvider` + `GeoBlockingGate` for geographic restrictions
- `GlobalErrorBoundary` at root

### 2F. Deprecated Hooks — CLEAN
- `useApplications` has been fully removed (confirmed: no imports found)
- Feature-specific hooks (`usePaginatedApplications`, `useApplicationsMutations`) are in use

---

## 3. DATABASE & SECURITY

### 3A. Role-Based Access — GOOD
- `can_access_sensitive_applicant_data` uses `has_role()` + `is_super_admin()` from `user_roles` table
- `get_current_user_role` RPC used for client-side role fetching
- No role stored on profiles table

### 3B. RLS Policies — GOOD (per memory context)
- Applications table: authenticated-only access with service_role bypass
- Public views use `security_invoker = false` for safe field exposure
- Sensitive views use `security_invoker = on`

### 3C. Trigger Consolidation — COMPLETE
All `updated_at` triggers use single canonical `update_updated_at_column()`

---

## 4. SHARED INFRASTRUCTURE

### 4A. CORS Config — GOOD
Centralized in `_shared/cors-config.ts`. Deprecated `cors.ts` re-exports for backward compat. `getCorsHeaders()` does origin validation with Lovable preview detection.

### 4B. Error Handler — GOOD
`_shared/error-handler.ts` with `wrapHandler` pattern. `_shared/response.ts` with standardized `successResponse`/`errorResponse`.

### 4C. Logger — GOOD
Backend: `_shared/logger.ts` with `createLogger()` (structured JSON).
Frontend: `src/lib/logger.ts` with production-optimized logging and Sentry integration.

### 4D. Rate Limiter — GOOD
`_shared/rate-limiter.ts` with geographic boosts.

### 4E. Validation — GOOD
`_shared/validation-schemas.ts`, `_shared/validation-helpers.ts`, `_shared/securitySchemas.ts` with Zod.

---

## 5. PRIORITIZED REFACTORING PLAN

### Tier 1 — Security & Correctness (do first)
1. **Add 5 Hayes functions to `config.toml`** — Missing config means deployment behavior may be unpredictable
2. **Remove `@ts-nocheck` from `application-processor.ts`** — Shared module used by many inbound functions
3. **Remove `@ts-nocheck` from `outbound-webhook` and `domain-configuration`** — Admin/security functions

### Tier 2 — Standardization (next sprint)
4. **Pin `_shared/supabase-client.ts` and `_shared/auth.ts` to `@2.50.0`** — Cascading fix for 27+ dependent functions
5. **Migrate 11 remaining hardcoded CORS functions to `getCorsHeaders()`**
6. **Batch-pin remaining ~48 functions to `@2.50.0`**

### Tier 3 — Code Quality (ongoing)
7. **Migrate ~40 functions from `createClient()` to `getServiceClient()`**
8. **Replace `console.*` with `createLogger()` in 22 functions**
9. **Consolidate 5 Hayes inbound functions into single parameterized function**
10. **Remove `@ts-nocheck` from remaining 12 functions**
11. **Fix Dialog accessibility warnings** (add `DialogDescription` or `aria-describedby`)
12. **Simplify double `ProtectedRoute` wrapping in admin routes**

### Tier 4 — Optional Improvements
13. **Remove `truthContract.ts` TODO** — Either implement the DB table or remove the dead code
14. **Add monitoring for `sync-cdl-feeds` deactivation errors** — Logs show `[object Object]` error messages (not properly serialized)

---

## 6. SUMMARY SCORECARD

| Area | Status | Grade |
|------|--------|-------|
| Auth & Security | Server-side roles, RLS, no client-side storage | A |
| Feature Architecture | Clean module boundaries, barrel exports | A |
| Routing | Lazy-loaded, legacy redirects, timeout protection | A- |
| Error Handling | Global boundary, structured logging, retry logic | A |
| CORS Standardization | 73% migrated, 11 remaining | B+ |
| SDK Version Pinning | 30% pinned, 48 unpinned | C+ |
| TypeScript Safety | 19 files still `@ts-nocheck` | C |
| Client Centralization | 40% on `getServiceClient()` | C+ |
| Logging Standardization | 78% on `createLogger()` | B |
| Config Completeness | 5 functions missing from `config.toml` | C |

**Overall**: Solid production architecture with well-designed patterns. The remaining work is batch standardization — applying existing best practices (already proven in completed functions) to the remaining ~40-50 functions that haven't been migrated yet.

