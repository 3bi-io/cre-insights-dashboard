

# Platform Refactoring & Best Practices Assessment

---

## Findings Summary

After auditing ~100 edge functions, ~90 frontend hooks, 40+ database functions, and the feature module architecture, here are the prioritized findings organized by severity.

---

## 1. Security Vulnerability: `can_access_sensitive_applicant_data` reads role from `profiles`

The database function `can_access_sensitive_applicant_data` reads `role` directly from the `profiles` table instead of using the `user_roles` table and `has_role()` function. This contradicts the platform's role architecture (which correctly uses `user_roles` everywhere else) and could lead to stale or bypassed role checks.

**Fix:** Replace the function body to use `has_role(auth.uid(), 'admin'::app_role)` and `is_super_admin(auth.uid())` — matching all other access-control functions like `get_applications_list_with_audit`.

---

## 2. Missing Config: `grok-chat` edge function not in `config.toml`

The `grok-chat` function exists, is deployed, and is actively called from the frontend (`useGrokChat`, `aiService`), but has no entry in `supabase/config.toml`. This means its `verify_jwt` setting defaults to whatever the Supabase project default is, creating an undocumented security posture.

**Fix:** Add `[functions.grok-chat]` with `verify_jwt = true` to `config.toml`.

---

## 3. Hardcoded CORS in 48 functions (continuing Phase 2)

48 functions still define `const corsHeaders = { 'Access-Control-Allow-Origin': '*' }` instead of using `getCorsHeaders()`. 47 functions have already adopted the shared utility. The remaining 48 represent the second half of migration.

**Fix:** Batch-migrate in groups of 10, prioritizing authenticated endpoints first (they benefit most from origin validation). Public XML feeds and webhooks (`verify_jwt = false`) are lower priority since they legitimately serve external consumers.

**Priority batch (authenticated, user-facing):**
- `data-analysis`, `chatbot-analytics`, `visitor-analytics`, `generate-logo`, `generate-image`, `admin-check`, `domain-configuration`, `openai-chat`, `social-oauth-init`, `generate-applications`

---

## 4. Manual `createClient()` in 58 functions (Phase 3)

58 functions still manually call `createClient(Deno.env.get('SUPABASE_URL'), ...)` instead of using the shared `getServiceClient()` (26 functions adopted). This means credential rotation or client config changes require touching 58 files.

**Fix:** Migrate in batches, starting with functions that already import other shared utilities (partial adopters are easiest to complete).

---

## 5. 24 functions with `@ts-nocheck`

24 edge functions suppress all TypeScript checking. Notable ones handling sensitive data:
- `sms-auth` (authentication flow)
- `admin-check` (authorization)
- `generate-applications` (data creation)
- `import-jobs-from-feed` (data import)
- `background-tasks` (cron operations)

**Fix:** Remove `@ts-nocheck` one function at a time, fixing type errors as they surface. Prioritize auth/data-critical functions.

---

## 6. Seven duplicate `updated_at` trigger functions

The database has 7 separate functions that all do the same thing (`NEW.updated_at = now(); RETURN NEW;`):
- `update_updated_at_column`
- `handle_updated_at`
- `update_candidate_profiles_updated_at`
- `handle_tenstreet_credentials_updated_at`
- `update_client_webhook_updated_at`
- `update_elevenlabs_conversations_updated_at`
- `update_ai_performance_metrics_updated_at`
- `update_ai_decision_tracking_updated_at`

**Fix:** Consolidate triggers to use a single function (`update_updated_at_column`). Reassign all triggers, then drop the redundant functions. This is a low-risk migration since the function bodies are identical.

---

## 7. Deprecated frontend hooks still in use (15 shim files)

15 hook files in `src/hooks/` are marked `@deprecated` and re-export from feature modules:
- 5 Tenstreet hooks → `@/features/tenstreet/hooks`
- 5 Platform hooks → `@/features/platforms/hooks`
- `useApplications` → still imported by `OrganizationApplicationsTab.tsx`
- `applicationHelpers.ts` → legacy formatter

**Fix:** Update `OrganizationApplicationsTab.tsx` to use `usePaginatedApplications` + `useApplicationsMutations`, then search for remaining consumers of each deprecated shim and remove those with zero imports.

---

## 8. SDK version drift across edge functions

At least 4 Supabase SDK versions in use:
- `@2` (bare, ~30 functions)
- `@2.7.1` (2 functions: `openai-chat`, `chatbot-analytics`)
- `@2.39.3` (3 functions: `visitor-analytics`, `import-applications`, `job-group-xml-feed`)
- `@2.43.0` (1 function: `background-tasks`)
- `@2.50.0` (20+ functions)

**Fix:** Pin all to `@2.50.0` (latest used). The bare `@2` imports auto-resolve to latest, but pinning ensures reproducible builds.

---

## 9. Console.log/error in 21 edge functions

21 functions use raw `console.log`/`console.error` instead of the structured `createLogger()`. Most already import `createLogger` for some paths but fall back to console in error handlers.

**Fix:** Replace `console.error('...',` with `logger.error('...',` in each function. Most already have a `logger` instance created.

---

## 10. Hayes client-specific inbound functions (5 functions)

Five near-identical edge functions (`hayes-danny-herman-inbound`, `hayes-dayross-inbound`, etc.) each serve a single client. They correctly use a shared handler factory, but could be consolidated into a single `hayes-inbound` function with a client slug parameter.

**Fix:** Create a single `hayes-inbound` function that reads the client slug from the URL path or query param. This reduces deployment surface from 5 functions to 1. Note: requires coordinating with webhook URL updates on the client side.

---

## Recommended Execution Order

| Phase | Items | Effort | Risk |
|-------|-------|--------|------|
| **Immediate** | #1 (security fix), #2 (config.toml) | 30 min | Low |
| **Short-term** | #3 priority batch (10 CORS), #7 (deprecated hooks) | 2-3 hrs | Low |
| **Medium-term** | #4 (createClient migration), #5 (ts-nocheck top 5), #8 (SDK pin) | 1-2 days | Medium |
| **Long-term** | #6 (trigger consolidation), #9 (logging), #10 (Hayes consolidation), remaining CORS/ts-nocheck | 2-3 days | Low |

---

## What's Working Well

- **Shared utilities are mature**: `cors-config.ts`, `supabase-client.ts`, `logger.ts`, `error-handler.ts`, `response.ts`, `serverAuth.ts` — all well-designed and production-ready
- **Audit logging**: PII access is properly gated through `get_application_with_audit` and `update_application_with_audit`
- **Role system**: `user_roles` table with `has_role()` SECURITY DEFINER function is correctly implemented (except the one legacy function in #1)
- **Feature module architecture**: Clean separation in `src/features/` with proper hook/service/component boundaries
- **Business hours / holiday system**: Well-architected with client-level overrides and timezone handling
- **ATS adapter pattern**: Extensible adapter factory with shared base class

