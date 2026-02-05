

## Application Source Review & Organic Traffic Optimization Plan

### Executive Summary

After a thorough review of all application sources and traffic collection mechanisms (excluding Meta), I've identified several areas where engagements are properly collected, areas needing improvement, and opportunities to optimize organic traffic sources.

---

### Current State Analysis

#### Application Sources Currently Tracked

| Source | Count (30 days) | Status | Collection Method |
|--------|-----------------|--------|-------------------|
| Direct Application | 75 | Active | `submit-application` edge function |
| ZipRecruiter | 63 | Active | Integration endpoint |
| Indeed | 48 | Active | `inbound-applications` webhook |
| ElevenLabs (Voice) | 18 | Active | Voice sync every 5 min |
| Embed Form | 4 | Active | Referral tracking |
| CDL Job Cast | 0 (recent) | Syncing | `sync-cdl-feeds` every 5 min |

#### Issues Identified

**1. ZipRecruiter Integration - Simulated Data**
- The `ziprecruiter-integration` edge function returns simulated analytics and job postings when credentials aren't configured
- No inbound application webhook exists for ZipRecruiter (applications are manually entered or come through Indeed)
- **Impact**: 63 applications show "ZipRecruiter" source but the actual collection path is unclear

**2. CDL Job Cast - No Application Sync**
- The `sync-cdl-feeds` function syncs **jobs only**, not applications
- The `fetch-application-feeds` function parses XML for applications but isn't called by any cron job
- Applications from CDL Job Cast partners (Pemberton, Danny Herman, Novco, Day and Ross) may not be automatically ingested
- **Impact**: Missing automated application collection from CDL partners

**3. Google Jobs - Feed Access Logging Empty**
- `feed_access_logs` table returns empty results despite having the logging infrastructure
- Google Jobs XML sitemap feed exists but no crawler activity is being tracked
- **Impact**: Cannot measure Google Jobs effectiveness

**4. Indeed XML Feed - Missing Organization Filter**
- The `indeed-xml-feed` function serves all active jobs globally without organization filtering
- No `organization_id` parameter support like other feeds
- **Impact**: Cannot segment Indeed feeds by organization

**5. Duplicate Cron Jobs**
- Both old and new cron jobs are active:
  - `sync-cdl-feeds-daily` (old) AND `sync-cdl-feeds-5min` (new)
  - `meta-leads-sync-every-6-hours` (old) AND `meta-leads-sync-5min` (new)
- **Impact**: Resource waste and potential duplicate processing

**6. Missing UTM Column in Database**
- Applications table lacks `utm_source` column despite the code attempting to collect it
- UTM tracking parameters are being sent but likely stored in `referral_source` or lost

---

### Implementation Plan

#### Phase 1: Fix Critical Data Collection Issues

**1.1 Create CDL Applications Sync Cron Job**

Create a new cron job to sync applications from CDL Job Cast partners:

```text
File: New migration to add cron job
Schedule: */5 * * * * (every 5 minutes)
Function: fetch-application-feeds → inbound-applications
```

The `fetch-application-feeds` function already parses XML applications but needs to:
- Be called on a schedule
- Push parsed applications to `inbound-applications` endpoint

**1.2 Add Missing `utm_source` Fields to Applications Table**

```sql
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
  ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
```

Update `submit-application` edge function to persist these fields.

**1.3 Clean Up Duplicate Cron Jobs**

```sql
SELECT cron.unschedule('sync-cdl-feeds-daily');
SELECT cron.unschedule('meta-leads-sync-every-6-hours');
```

#### Phase 2: Enhance Feed Tracking

**2.1 Fix Feed Access Logging**

The `feed_access_logs` table exists but logs aren't being written consistently. Update all feed functions to ensure logging:

- `google-jobs-xml` - Fix `organization_id` extraction
- `indeed-xml-feed` - Add `organization_id` parameter support
- `universal-xml-feed` - Verify IP logging

**2.2 Add ZipRecruiter Inbound Webhook**

Create `ziprecruiter-webhook` edge function to handle:
- Application notifications from ZipRecruiter
- Candidate data mapping to applications table
- Source tracking as "ZipRecruiter"

**2.3 Enhance Indeed XML Feed**

Add `organization_id` parameter to filter jobs per organization:

```typescript
// in indeed-xml-feed/index.ts
const organizationId = url.searchParams.get('organization_id');
if (organizationId) {
  query = query.eq('organization_id', organizationId);
}
```

#### Phase 3: Organic Traffic Optimization

**3.1 Google Jobs Schema Improvements**

Current `JobPosting` schema is good but missing some recommended fields:

| Field | Current | Recommended |
|-------|---------|-------------|
| `identifier` | Yes | Yes |
| `validThrough` | 30 days | Keep |
| `directApply` | Yes | Yes |
| `applicantLocationRequirements` | Remote only | Add for all jobs |
| `experienceRequirements` | Missing | Add |
| `educationRequirements` | Missing | Add |
| `responsibilities` | Missing | Add (extract from description) |
| `qualifications` | Missing | Add (extract from description) |

**3.2 Enhance robots.txt for Better Crawling**

Current `robots.txt` is well-configured. Add:

```text
# Job-specific sitemaps for faster indexing
Sitemap: https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/google-jobs-xml?organization_id=YOUR_ORG_ID
```

**3.3 Implement Google Indexing API Automation**

The `google-indexing` edge function exists but isn't automated. Add:
- Auto-notify Google when jobs are created/updated
- Trigger on job status change to "inactive" (URL_DELETED)

**3.4 Create SEO Dashboard for Organic Metrics**

New component to track:
- Google Jobs impressions (via Search Console API)
- Organic traffic by referrer
- Job page views vs applications (conversion rate)
- Top-performing job listings organically

---

### Technical Details

#### Database Migrations Required

1. **Add UTM tracking columns to applications**
2. **Remove duplicate cron jobs**
3. **Create CDL applications sync cron**

#### Edge Functions to Modify

| Function | Changes |
|----------|---------|
| `submit-application` | Save `utm_source`, `utm_medium`, `utm_campaign` |
| `indeed-xml-feed` | Add `organization_id` filter |
| `fetch-application-feeds` | Connect to inbound pipeline |
| `sync-cdl-feeds` | (No change - syncs jobs correctly) |

#### New Edge Function

| Function | Purpose |
|----------|---------|
| `ziprecruiter-webhook` | Handle inbound applications from ZipRecruiter |

#### Frontend Components

| Component | Changes |
|-----------|---------|
| `FeedAnalyticsSection` | Show real data when `feed_access_logs` populated |
| `JobDetailsPage` | Add `experienceRequirements`, `qualifications` schema |

---

### Recommended Priorities

1. **High Priority (Immediate)**
   - Add UTM columns and update submit-application
   - Remove duplicate cron jobs
   - Fix feed access logging

2. **Medium Priority (This Week)**
   - Create CDL applications sync
   - Enhance JobPosting schema
   - Add Indeed organization filter

3. **Lower Priority (Future)**
   - ZipRecruiter webhook
   - Google Indexing automation
   - SEO dashboard

---

### Organic Traffic Optimization Recommendations

1. **Content Optimization**
   - Ensure all job descriptions are 200+ words
   - Include salary information on every job (Google prioritizes)
   - Add clear location data (city, state, postal code)

2. **Technical SEO**
   - Dynamic sitemap is working correctly
   - Add sitemap index file for multiple org sitemaps
   - Implement breadcrumb schema (already present)

3. **Link Building**
   - Create shareable job links with UTM parameters
   - Add social sharing meta tags (already present)

4. **Conversion Optimization**
   - Add "Apply with Voice" prominent CTA
   - Implement one-click apply from Google Jobs (`directApply: true` is set)
   - Track time-to-apply metrics

