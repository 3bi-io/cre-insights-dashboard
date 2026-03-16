

# Source Attribution Audit: Why 34% of Applications Show as "Direct"

## Data Evidence

Last 30 days: **78 of 223 applications (35%)** are tagged "Direct Application." Every single one has **null** `referral_source`, **null** `ad_id`, and **null** `campaign_id` — meaning no attribution data reached the backend at all.

The top offending jobs are all "General Application" listings for Danny Herman (52), Pemberton (18), and James Burg (5). These are the exact clients you're running paid ads for.

Meanwhile, the 5 Facebook-attributed applications all have `referral_source` like `https://l.facebook.com/` — they were correctly attributed **only because `document.referrer` survived the redirect**. But this is unreliable and increasingly fails on mobile browsers and in-app webviews.

## Root Causes

### 1. XML Feeds Don't Include `utm_source` (PRIMARY CAUSE)

Both `indeed-xml-feed` and `universal-xml-feed` build apply URLs like:
```
https://applyai.jobs/apply?job_listing_id=ABC&organization_id=XYZ&client_id=123
```

There is **no `utm_source` parameter**. When Indeed, ZipRecruiter, Appcast, Jooble, or any programmatic platform serves these URLs to candidates, the click arrives with no UTM context. If the platform also strips the `Referer` header (common with HTTPS→HTTPS redirects, especially on mobile), you get "Direct Application."

ZipRecruiter bypasses this because it uses a dedicated webhook (not the XML feed), so its 83 applications are correctly attributed. Indeed's 25 attributed ones likely came via direct Indeed Apply integration, not the feed.

### 2. Meta/Facebook Ads Don't Pass UTM Parameters

The `meta_ads` table has no URL tracking template or UTM configuration fields. When Meta sends traffic to your apply pages, the only signal is `document.referrer` which contains `l.facebook.com` or `m.facebook.com`. This works inconsistently — it fails in:
- Facebook in-app browser (referrer often stripped)
- Instagram stories/reels clicks
- Mobile Chrome with strict referrer policies

Meta's URL Parameters feature (`url_tags`) should inject `utm_source=facebook&utm_medium=paid&ad_id={{ad.id}}&campaign_id={{campaign.id}}` automatically — but this isn't configured.

### 3. `document.referrer` Is Unreliable as a Fallback

The current priority chain is: `explicit source > headers > utm_source > document.referrer > "Direct Application"`

`document.referrer` is the last meaningful signal, but modern browsers increasingly strip it. Safari ITP, Chrome's reduced referrer policy, and in-app webviews all limit what gets passed. This means any traffic source that doesn't embed UTM params in the URL will increasingly show as "Direct."

## Proposed Fix

### A. Add `utm_source` to All XML Feed Apply URLs

In `universal-xml-feed` `buildApplyUrl()` and `indeed-xml-feed`, append a platform-specific UTM source based on the feed format being generated:

```
function buildApplyUrl(job, feedSource) {
  let url = `https://applyai.jobs/apply?job_listing_id=${job.id}`;
  if (job.organization_id) url += `&organization_id=${job.organization_id}`;
  if (job.client_id) url += `&client_id=${job.client_id}`;
  url += `&utm_source=${feedSource}&utm_medium=job_board`;
  return url;
}
```

Each XML generator calls this with the appropriate source: `indeed`, `ziprecruiter`, `appcast`, `jooble`, `neuvoo`, `talroo`, `google_jobs`, `jobrapido`, etc.

### B. Add `fbclid` and `gclid` Detection to Source Attribution

When Meta or Google ads direct users to the apply page, they often append `fbclid=...` or `gclid=...` even when UTM params are missing. The frontend hooks should capture these and pass them to the backend, and the backend should use them as attribution signals:

- Frontend: Capture `fbclid` and `gclid` from URL params in all three form hooks
- Backend: In `detectIntegrationSource`, check for `fbclid` → "Facebook" and `gclid` → "Google Ads" before falling back to "Direct Application"

### C. Add `m.facebook.com` to REFERRER_SOURCE_MAP

Currently missing: `m.facebook.com` (mobile Facebook). The existing map has `facebook.com` and `l.facebook.com` but not the mobile variant. This is a quick win.

### D. Log All Attribution Signals for Debugging

Store the raw attribution data (all UTM params, referrer, fbclid, gclid, user-agent) in a JSON column on the application so misattributed records can be retroactively fixed — similar to the Hayes re-attribution done previously.

### E. Add `utm_source` Validation to Meta Ad Creation

When creating Meta ads through the platform integration, automatically set `url_tags` on the ad/adset to include `utm_source=facebook&utm_medium=paid&campaign_id={{campaign.id}}&ad_id={{ad.id}}`.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/universal-xml-feed/index.ts` | Pass feed format to `buildApplyUrl`, append `utm_source` + `utm_medium` |
| `supabase/functions/indeed-xml-feed/index.ts` | Add `utm_source=indeed&utm_medium=job_board` to apply URLs |
| `supabase/functions/job-group-xml-feed/index.ts` | Add UTM params to `apply_url` generation |
| `supabase/functions/submit-application/index.ts` | Add `fbclid`/`gclid` detection, add `m.facebook.com` to referrer map, store raw attribution JSON |
| `src/hooks/useApplicationForm.ts` | Capture `fbclid`, `gclid` from URL params |
| `src/hooks/useEmbedApplicationForm.ts` | Same `fbclid`/`gclid` capture |
| `src/hooks/useDetailedApplicationForm.ts` | Same `fbclid`/`gclid` capture |
| `supabase/functions/submit-application/index.ts` (schema) | Add `fbclid`, `gclid` to Zod schema |

## Impact Estimate

Based on the data: the 78 "Direct Application" records are likely split between Indeed feed traffic (no UTM), Facebook/Meta ad traffic (referrer stripped), and genuinely direct visits. With these fixes, I'd estimate 60-70% of current "Direct" would be correctly attributed.

