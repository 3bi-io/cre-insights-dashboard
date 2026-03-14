

# Platform Refactoring Assessment

Based on a thorough audit of the codebase, here are the prioritized areas requiring attention to maintain platform integrity and best-in-class standards.

---

## Critical: Active Bugs

### 1. Unverified sender domain in Morning Digest
`supabase/functions/morning-digest/index.ts` (line 212) still uses `noreply@applyai.jobs` -- the same unverified domain that was just fixed in the calendar invitation flow. This means **morning digest emails are silently failing** for all recruiters. Fix: replace with `getSender('notifications')` from the shared email config.

---

## High Priority: Security and Reliability

### 2. Deprecated CORS import still in use (2 functions)
`inbound-applications/index.ts` and `elevenlabs-outbound-call/index.ts` import from `cors.ts` (deprecated shim) instead of `cors-config.ts`. While functional today, this creates a fragile dependency chain.

### 3. 23 edge functions use `@ts-nocheck`
Functions like `meta-leads-cron`, `admin-check`, `chatbot-analytics`, and 20 others suppress all TypeScript checking. This masks type errors, null reference bugs, and API contract violations that could cause silent runtime failures.

### 4. ~60 functions manually initialize Supabase client
Only ~27 functions use the shared `getServiceClient()` from `supabase-client.ts`. The remaining ~60 manually call `createClient(Deno.env.get(...))`, bypassing centralized configuration and making credential rotation or client upgrades a manual hunt across dozens of files.

### 5. ~92 functions use hardcoded CORS headers
Despite having a robust `getCorsHeaders()` utility with origin validation, ~92 functions still define `const corsHeaders = { 'Access-Control-Allow-Origin': '*' }`. This means:
- No origin allowlisting on most endpoints
- Inconsistent header sets (some miss the Supabase platform headers)

---

## Medium Priority: Code Quality and Maintainability

### 6. ~21 functions use raw `console.error`/`console.log`
The platform has a structured `createLogger()` utility that provides context-tagged, searchable logs. Raw console calls in functions like `generate-ad-creative`, `firecrawl-*`, `ziprecruiter-integration`, and `organization-api` produce unstructured output that's harder to diagnose in production.

### 7. Deprecated `useApplications` hook still exported
`src/features/applications/hooks/useApplications.tsx` and its client-side filter utilities are marked `@deprecated` in favor of `usePaginatedApplications` + `useApplicationsMutations`. These should be audited for remaining consumers and removed to prevent new code from using the legacy path.

### 8. Inconsistent Supabase SDK versions across functions
Functions reference at least 4 different versions: `@2`, `@2.7.1`, `@2.43.0`, `@2.50.0`. While ESM CDN resolves these independently, version drift can cause subtle behavioral differences in auth, RLS handling, or query building.

---

## Recommended Refactoring Phases

### Phase 1 -- Immediate (fixes active failures)
- Fix `morning-digest` sender domain (same pattern as calendar fix)
- Estimated effort: 10 minutes

### Phase 2 -- Short-term (security hardening)
- Migrate 2 functions off deprecated `cors.ts` import
- Standardize CORS to use `getCorsHeaders()` in top 10 highest-traffic functions first
- Estimated effort: 2-3 hours

### Phase 3 -- Medium-term (reliability)
- Migrate manual `createClient` calls to `getServiceClient()` / `getAuthenticatedClient()` in batches of 5-10 functions
- Replace `console.error`/`console.log` with `createLogger()` in the 21 affected functions
- Pin Supabase SDK to a single version (`@2.50.0`)
- Estimated effort: 1-2 days

### Phase 4 -- Cleanup (maintainability)
- Remove `@ts-nocheck` from the 23 functions, fixing type errors as they surface
- Remove deprecated `useApplications` hook after confirming zero consumers
- Remove `cors.ts` shim file once all imports are migrated
- Estimated effort: 2-3 days

---

## Summary

The most urgent item is the **morning-digest sender domain** -- it's the exact same bug just fixed in calendar invitations and is actively preventing email delivery. Beyond that, the platform has solid shared utilities (`cors-config`, `supabase-client`, `logger`, `error-handler`, `response`) but adoption is incomplete across the ~100+ edge functions. A phased migration following the existing `REFACTORING_GUIDE.md` patterns will systematically close these gaps.

