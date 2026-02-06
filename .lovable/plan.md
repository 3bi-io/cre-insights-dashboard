
# Complete CDL Job Cast Feed Data Capture Plan

This plan addresses all 4 key insights identified in the feed analysis, implementing complete data capture at scale across the job ingestion pipeline.

## Overview of Key Insights to Capture

| # | Insight | Current State | Action Required |
|---|---------|---------------|-----------------|
| 1 | `<jobreferrer>` campaign tracking | Already captured | Enhance with analytics views |
| 2 | `<date>` posting timestamp | Not captured | Add column + extraction logic |
| 3 | `<indeed-apply-data>` integration block | Not captured | Parse + store structured data |
| 4 | Tracking pixel for impressions | Embedded in description | Extract + store for analytics |

---

## Phase 1: Database Schema Updates

### 1.1 Add New Columns to `job_listings`

```text
+-------------------------+------------+----------------------------------------+
| Column                  | Type       | Purpose                                |
+-------------------------+------------+----------------------------------------+
| feed_date               | TIMESTAMP  | Original posting date from XML feed    |
| indeed_apply_api_token  | TEXT       | Indeed Apply integration token         |
| indeed_apply_job_id     | TEXT       | Indeed's internal job ID               |
| indeed_apply_post_url   | TEXT       | Indeed Apply POST endpoint             |
| tracking_pixel_url      | TEXT       | Extracted 1x1 pixel URL for analytics  |
+-------------------------+------------+----------------------------------------+
```

### 1.2 Create Feed Metadata Table

A new `job_feed_metadata` table to store extended feed attributes without bloating the main table:

```text
+---------------------+------------+------------------------------------------+
| Column              | Type       | Purpose                                  |
+---------------------+------------+------------------------------------------+
| id                  | UUID       | Primary key                              |
| job_listing_id      | UUID (FK)  | Reference to job_listings                |
| raw_indeed_data     | JSONB      | Full indeed-apply-data block             |
| raw_feed_xml        | TEXT       | Optional: original job XML for debugging |
| extracted_at        | TIMESTAMP  | When data was captured                   |
+---------------------+------------+------------------------------------------+
```

---

## Phase 2: XML Parser Enhancements

### 2.1 Extend `ParsedJob` Interface

Add new fields to the interface in `supabase/functions/_shared/xml-parser.ts`:

- `feed_date` - from `<date>` node
- `indeed_apply_api_token` - extracted from `<indeed-apply-data>`
- `indeed_apply_job_id` - extracted from `<indeed-apply-data>`
- `indeed_apply_post_url` - extracted from `<indeed-apply-data>`
- `tracking_pixel_url` - extracted from description via regex

### 2.2 Add New Extraction Functions

1. **`extractIndeedApplyData(jobXml)`** - Parse the `<indeed-apply-data>` block and extract:
   - `indeed-apply-apiToken`
   - `indeed-apply-jobId`
   - `indeed-apply-postUrl`

2. **`extractTrackingPixel(description)`** - Regex to find 1x1 tracking pixel URLs embedded in job descriptions (typically `<img src="..." width="1" height="1">`)

3. **`parseFeedDate(dateString)`** - Normalize date strings from various formats to ISO timestamp

### 2.3 Update `parseJobFromXML()`

Integrate all new extraction functions into the main parsing flow.

---

## Phase 3: Sync Function Updates

### 3.1 Update `sync-cdl-feeds/index.ts`

Modify the job data mapping to include:

```text
{
  // Existing fields...
  
  // NEW: Date tracking
  feed_date: job.feed_date || null,
  
  // NEW: Indeed Apply integration
  indeed_apply_api_token: job.indeed_apply_api_token || null,
  indeed_apply_job_id: job.indeed_apply_job_id || null,
  indeed_apply_post_url: job.indeed_apply_post_url || null,
  
  // NEW: Tracking pixel
  tracking_pixel_url: job.tracking_pixel_url || null,
}
```

### 3.2 Update `import-jobs-from-feed/index.ts`

Mirror the same changes for manual feed imports.

### 3.3 Optional: Store Raw Indeed Data in Metadata Table

For jobs with Indeed Apply data, insert a record into `job_feed_metadata` with the full JSONB payload for future extensibility.

---

## Phase 4: Admin UI Enhancements

### 4.1 Job Details Panel Updates

Extend the job details view to display:

1. **Feed Date** - Show original posting date vs. system `created_at`
2. **Indeed Apply Status** - Badge indicating if Indeed Apply integration is available
3. **Tracking Pixel** - Show if impression tracking is active

### 4.2 New "Feed Data" Tab in Job Details

Create a dedicated section showing:

- Raw `jobreferrer` value
- Indeed Apply configuration (token, job ID, post URL)
- Tracking pixel URL (clickable link)
- Last feed sync timestamp

### 4.3 Campaign Analytics Enhancement

Add columns to the Campaigns page showing:
- Jobs with Indeed Apply enabled (count)
- Jobs with tracking pixels (count)
- Feed date distribution (oldest/newest)

---

## Phase 5: Analytics & Reporting

### 5.1 Create Analytics Views

SQL views for reporting on feed data quality:

```text
CREATE VIEW feed_data_coverage AS
SELECT 
  client_id,
  COUNT(*) as total_jobs,
  COUNT(feed_date) as jobs_with_date,
  COUNT(indeed_apply_job_id) as jobs_with_indeed_apply,
  COUNT(tracking_pixel_url) as jobs_with_tracking,
  COUNT(jobreferrer) as jobs_with_campaign
FROM job_listings
WHERE status = 'active'
GROUP BY client_id;
```

### 5.2 Feed Quality Dashboard Card

Add a dashboard widget showing data completeness metrics:
- % of jobs with complete feed data
- Indeed Apply adoption rate
- Campaign attribution coverage

---

## Technical Implementation Details

### File Changes Summary

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Add new columns to `job_listings`, create `job_feed_metadata` table |
| `supabase/functions/_shared/xml-parser.ts` | Extend interface, add extraction functions |
| `supabase/functions/sync-cdl-feeds/index.ts` | Map new fields to database |
| `supabase/functions/import-jobs-from-feed/index.ts` | Mirror sync function changes |
| `src/components/jobs/JobTable.tsx` | Display new feed data indicators |
| `src/features/jobs/components/JobDetailsPanel.tsx` | Add "Feed Data" section (new or existing) |

### Edge Cases Handled

1. **Missing Indeed Apply Data** - Some jobs may not have this block; handle gracefully with null values
2. **Multiple Tracking Pixels** - Extract the first valid pixel URL if multiple exist
3. **Date Format Variations** - Parser handles common formats (ISO, US, European)
4. **Large XML Payloads** - JSONB storage for raw data limits exposure to schema changes

### Backward Compatibility

- All new columns are nullable with no defaults (except indexes)
- Existing jobs will have null values until next sync populates them
- No breaking changes to existing feed processing
