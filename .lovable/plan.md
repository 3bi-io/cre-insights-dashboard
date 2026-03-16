

# Platform Refactoring & Best Practices — Progress

## Completed

### Phase 1 (Previous session)
- ✅ Fixed morning-digest sender domain (verified email)
- ✅ Migrated inbound-applications CORS to getCorsHeaders
- ✅ Migrated elevenlabs-outbound-call CORS to getCorsHeaders

### Phase 2 (Previous session)
- ✅ **#1 Security Fix**: `can_access_sensitive_applicant_data` now uses `has_role()` + `is_super_admin()` from `user_roles` table instead of reading role from `profiles`
- ✅ **#2 Config**: Added `grok-chat` to `config.toml` with `verify_jwt = true`
- ✅ **#3 CORS Migration** (8 functions): data-analysis, chatbot-analytics, visitor-analytics, generate-logo, admin-check, domain-configuration, social-oauth-init, generate-applications — all migrated to `getCorsHeaders()`
- ✅ **#6 Trigger Consolidation**: Dropped 7 duplicate `updated_at` trigger functions, reassigned all triggers to use single `update_updated_at_column()`
- ✅ #7: Updated OrganizationApplicationsTab.tsx to use usePaginatedApplications + useApplicationsMutations, deleted deprecated useApplications hook
- ✅ #5: Removed @ts-nocheck from 5 security-critical functions (sms-auth, admin-check, generate-applications, import-jobs-from-feed, background-tasks)

### Phase 3 (Current session — 2026-03-16)
- ✅ **Config**: Added 5 Hayes inbound functions to `config.toml` (hayes-danny-herman-inbound, hayes-dayross-inbound, hayes-jamesburg-inbound, hayes-novco-inbound, hayes-pemberton-inbound) with `verify_jwt = false`
- ✅ **@ts-nocheck removal**: Removed from `application-processor.ts` (shared module), `outbound-webhook`, `domain-configuration` — added proper types, typed catch blocks, pinned SDK
- ✅ **SDK Pinning**: Pinned `_shared/supabase-client.ts` and `_shared/auth.ts` to `@supabase/supabase-js@2.50.0` (cascading fix for 27+ dependent functions)
- ✅ **CORS Migration** (11 functions): send-application-email, admin-update-password, auth-email-templates, email-unsubscribe, send-test-emails, generate-founders-pass-creative, generate-ad-creative, background-check, background-check-webhook, send-magic-link, send-invite-email — all migrated to `getCorsHeaders()`
- ✅ **CORS Migration** (9 functions, previous batch): firecrawl-crawl, firecrawl-search, blog-rss, trigger-webhook, send-welcome-email, backfill-webhook, generate-sitemap, client-webhook, send-screening-request

## Remaining

### Medium-term
- [ ] #4: Migrate ~40 functions from manual createClient() to getServiceClient()
- [ ] #8: Batch-pin remaining ~48 edge functions from @supabase/supabase-js@2 to @2.50.0

### Long-term
- [ ] #3 remaining: CORS migration complete ✅ (all 20 hardcoded functions migrated)
- [ ] #9: Replace console.log/error with createLogger() in 22 functions
- [ ] #10: Consolidate 5 Hayes inbound functions into single parameterized function
- [ ] #11: Remove @ts-nocheck from remaining 12 edge functions
- [ ] #12: Fix Dialog accessibility warnings (add DialogDescription or aria-describedby)
- [ ] #13: Simplify double ProtectedRoute wrapping in admin routes
