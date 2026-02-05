

# Comprehensive Supabase Infrastructure Review

## Executive Summary

This review identifies orphaned tables, edge functions needing updates, missing configurations, and cleanup opportunities across the Supabase infrastructure. The project has **104 tables**, **85+ edge functions**, and **363 RLS policies**.

---

## 1. ORPHANED/UNUSED TABLES (Priority: Medium)

The following tables have **0 rows** and no active usage in the codebase:

### Analytics Tables (0 rows each)
| Table | Status | Recommendation |
|-------|--------|----------------|
| `adzuna_analytics` | Schema exists, no data | Keep - may be needed when Adzuna integration is used |
| `indeed_analytics` | Schema exists, no data | Keep - may be needed when Indeed integration is used |
| `talroo_analytics` | Schema exists, no data | Keep - may be needed when Talroo integration is used |
| `craigslist_analytics` | Schema exists, no data | Keep - may be needed for Craigslist integration |
| `cdl_jobcast_analytics` | Schema exists, no data | Keep - CDL job analytics |

### AI/ML Tables (0 rows each)
| Table | Status | Recommendation |
|-------|--------|----------------|
| `ai_analysis_cache` | No data | Keep - cache table, expected to be empty at times |
| `ai_decision_tracking` | No data | Keep - will populate when AI scoring is used |
| `ai_interaction_logs` | No data | Keep - logging table |
| `ai_metrics` | No data | Keep - metrics collection |
| `ai_performance_metrics` | No data | Keep - performance tracking |
| `campaign_ai_analysis` | No data | Keep - AI campaign analysis |

### Candidate/Talent Tables (0 rows each)
| Table | Status | Recommendation |
|-------|--------|----------------|
| `candidate_assessments` | No data | Keep - assessment feature not yet used |
| `candidate_rankings` | No data | Keep - ranking feature not yet used |
| `candidate_scores` | No data | Keep - scoring feature not yet used |
| `talent_pools` | No data | Keep - talent pool feature |
| `talent_pool_members` | No data | Keep - pool membership |
| `assessment_templates` | No data | Keep - assessment templates |
| `job_group_suggestions` | No data | Keep - AI suggestions |

### Integration Tables (0 rows each)
| Table | Status | Recommendation |
|-------|--------|----------------|
| `driverreach_credentials` | No data | Keep - DriverReach integration exists |
| `driverreach_field_mappings` | No data | Keep - field mappings |
| `organization_bgc_connections` | No data | Keep - background check connections |
| `background_check_requests` | No data | Keep - BGC feature |
| `communication_logs` | No data | Keep - communication tracking |
| `organization_publisher_access` | No data | Keep - publisher access |
| `organization_usage` | No data | Keep - usage tracking |
| `tenstreet_bulk_operations` | No data | Keep - bulk ops feature |
| `tenstreet_webhook_logs` | No data | Keep - webhook logging |
| `tenstreet_xchange_requests` | No data | Keep - xchange feature |
| `pii_access_logs` | No data | Keep - security audit logging |

### Social Tables (Mixed usage)
| Table | Rows | Recommendation |
|-------|------|----------------|
| `social_beacon_configurations` | 4 | Keep - active feature |
| `social_response_templates` | 60 | Keep - active feature |
| `social_engagement_metrics` | 0 | Keep - metrics collection |
| `social_interactions` | 0 | Keep - interaction tracking |
| `social_platform_connections` | 0 | Keep - OAuth connections |
| `social_responses` | 0 | Keep - response tracking |

---

## 2. MISSING TABLES REFERENCED IN CODE/DOCS (Priority: High)

### Tables Referenced but DO NOT EXIST

| Table | Referenced In | Issue | Action Required |
|-------|---------------|-------|-----------------|
| `blog_posts` | `SECURITY_DECISIONS.md`, `generate-sitemap` edge function | Table does not exist | Create table OR update references |
| `blog_categories` | `SECURITY_DECISIONS.md` | Table does not exist | Create table OR update references |
| `candidate_saved_jobs` | `useSavedJobs.ts` hook | Table does not exist | Create table to fix saved jobs feature |
| `visitor_analytics` | `SECURITY_DECISIONS.md` | Table does not exist (only `visitor_sessions` exists) | Update documentation |
| `recruiter_assignments` | `SECURITY_DECISIONS.md` | Table does not exist | Update documentation |

### Database Migration Required

```sql
-- Option 1: Create missing tables

-- candidate_saved_jobs table (REQUIRED for saved jobs feature)
CREATE TABLE IF NOT EXISTS public.candidate_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(candidate_profile_id, job_listing_id)
);

-- Enable RLS
ALTER TABLE public.candidate_saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own saved jobs
CREATE POLICY "Users can manage their saved jobs"
  ON public.candidate_saved_jobs
  FOR ALL
  USING (candidate_profile_id IN (
    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
  ));
```

---

## 3. EDGE FUNCTIONS NOT IN config.toml (Priority: High)

The following edge functions exist in the filesystem but are **missing from `supabase/config.toml`**:

| Function | Exists in Filesystem | Used in Code | Action |
|----------|---------------------|--------------|--------|
| `email-unsubscribe` | Yes | CAN-SPAM compliance | **Add to config.toml** (verify_jwt = false) |
| `get-shared-conversation` | Yes | Voice sharing feature | **Add to config.toml** (verify_jwt = false) |
| `social-oauth-callback` | Yes | OAuth flow | **Add to config.toml** (verify_jwt = false) |
| `social-oauth-init` | Yes | OAuth flow | **Add to config.toml** (verify_jwt = true) |
| `verify-platform-secrets` | Yes | Platform credentials | **Add to config.toml** (verify_jwt = true) |
| `x-platform-integration` | Yes | X/Twitter integration | **Add to config.toml** (verify_jwt = true) |
| `ziprecruiter-integration` | Yes | ZipRecruiter actions | **Add to config.toml** (verify_jwt = true) |
| `send-test-emails` | Yes | Email testing | **Add to config.toml** (verify_jwt = true) |

### Config.toml Updates Required

```toml
[functions.email-unsubscribe]
verify_jwt = false

[functions.get-shared-conversation]
verify_jwt = false

[functions.social-oauth-callback]
verify_jwt = false

[functions.social-oauth-init]
verify_jwt = true

[functions.verify-platform-secrets]
verify_jwt = true

[functions.x-platform-integration]
verify_jwt = true

[functions.ziprecruiter-integration]
verify_jwt = true

[functions.send-test-emails]
verify_jwt = true
```

---

## 4. SECURITY_DECISIONS.md INACCURACIES (Priority: Medium)

The documentation references tables that don't exist or have different names:

| Documentation Reference | Actual Status | Action |
|------------------------|---------------|--------|
| `blog_posts` | Does not exist | Remove from doc OR create table |
| `blog_categories` | Does not exist | Remove from doc OR create table |
| `visitor_analytics` | Does not exist (use `visitor_sessions`) | Update documentation |
| `recruiter_assignments` | Does not exist | Remove from documentation |

---

## 5. META INTEGRATION TABLES - NO DATA (Priority: Low)

All Meta/Facebook integration tables have 0 rows:

| Table | Rows | Notes |
|-------|------|-------|
| `meta_ad_accounts` | 0 | Awaiting Meta integration setup |
| `meta_ad_sets` | 0 | Awaiting Meta integration setup |
| `meta_ads` | 0 | Awaiting Meta integration setup |
| `meta_campaigns` | 0 | Awaiting Meta integration setup |
| `meta_daily_spend` | 0 | Awaiting Meta integration setup |

**Recommendation**: Keep these tables - they're structured for Meta Ads API integration.

---

## 6. VIEWS STATUS (All Working)

The following views exist and function correctly:

| View | Purpose | Status |
|------|---------|--------|
| `applications_basic` | Non-sensitive application data | Active |
| `applications_contact` | Contact information view | Active |
| `applications_sensitive` | PII data (restricted access) | Active |
| `ats_sync_overview` | ATS sync dashboard data | Active |
| `public_client_info` | Public client data | Active |
| `public_organization_info` | Public org data | Active |
| `public_shared_conversation_info` | Shared voice conversations | Active |

---

## 7. RECOMMENDED CLEANUP ACTIONS

### Phase 1: Critical Fixes (Immediate)

1. **Create `candidate_saved_jobs` table** - The saved jobs feature is broken without this table

2. **Update `config.toml`** - Add the 8 missing edge function configurations

3. **Update `SECURITY_DECISIONS.md`** - Remove references to non-existent tables

### Phase 2: Code Cleanup (Next Sprint)

1. **Update `generate-sitemap` edge function** - Remove or conditionally handle blog_posts query (line 112-116)

2. **Review `useSavedJobs.ts`** - Currently uses `as any` type cast to bypass TypeScript errors

### Phase 3: Table Audit (Quarterly)

1. Monitor empty analytics tables (adzuna, indeed, talroo, craigslist)
2. Evaluate if talent pool/assessment features will be used
3. Consider archiving if features remain unused after 6 months

---

## 8. DATABASE STATISTICS SUMMARY

| Category | Count | Notes |
|----------|-------|-------|
| Total Tables | 104 | Includes some with 0 rows |
| Total Views | 7 | All functional |
| Tables with Data | ~75 | Actively used |
| Tables Empty | ~29 | Analytics/feature tables |
| RLS Policies | 363 | Comprehensive coverage |
| Edge Functions (filesystem) | 85+ | 8 missing from config |
| Edge Functions (config.toml) | 77 | Configured functions |

---

## 9. FILES TO MODIFY

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add 8 missing function configurations |
| `SECURITY_DECISIONS.md` | Update table references |
| `supabase/functions/generate-sitemap/index.ts` | Handle missing blog_posts table |
| Database Migration | Create `candidate_saved_jobs` table |

