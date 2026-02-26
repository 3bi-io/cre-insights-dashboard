
# Fix: Embed Apply Form Submission Failing

## Root Cause

The embed form at `/embed/apply` fails to submit when loaded in an iframe on external sites (e.g., `hayesairecruiting.com`) because the **source detection chain breaks**:

1. **Priority 0 (Referer path check)** fails: The fetch call from `https://applyai.jobs/embed/apply` to `https://auwhcdpppldjlcaxzsme.supabase.co` is cross-origin. The default `strict-origin-when-cross-origin` referrer policy strips the URL path, sending only `https://applyai.jobs` as the Referer header. So `refererHeader.includes('/embed/apply')` never matches.

2. **Priority 1 (Explicit source)** should work since the form sets `source: 'Embed Form'` in the body, but it appears to not be reaching the server properly.

3. **Priority 2 (Integration signatures)** also fails because `embed/apply` is checked against the combined origin/referer/user-agent string, which no longer contains the path.

4. **Priority 4 (Referrer classification)** kicks in, classifying `hayesairecruiting.com` as "Company Website" -- which has no org mapping, causing the "Unable to determine organization" error.

## Fix (2 files)

### 1. `src/hooks/useEmbedApplicationForm.ts` -- Fix Referer header

Add `referrerPolicy: 'unsafe-url'` to the fetch call so the full URL path (including `/embed/apply`) is sent as the Referer header to the edge function. This makes Priority 0 detection work again.

```typescript
const response = await fetch('https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/submit-application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  referrerPolicy: 'unsafe-url',  // <-- Send full path so backend detects /embed/apply
  body: JSON.stringify(formattedData),
});
```

### 2. `supabase/functions/submit-application/index.ts` -- Add fallback detection

Add a secondary check: if the `referral_source` field (which is `document.referrer` from the parent frame) is from `hayesairecruiting.com`, AND the explicit source is `'Embed Form'`, ensure it routes correctly. Also add `hayesairecruiting.com` to the integration signatures as an additional safety net:

- In `detectIntegrationSource`, after the Referer header check (Priority 0), also check if `referralSource` contains `hayesairecruiting.com` combined with `explicitSource === 'Embed Form'` to return `'Embed Form'`
- Add `'hayesairecruiting.com'` to `INTEGRATION_SIGNATURES` mapping to `{ source: 'Hayes Website', requiresScreening: false }`
- Add `'Hayes Website'` to `SOURCE_ORGANIZATION_OVERRIDES` pointing to Hayes org ID `84214b48-7b51-45bc-ad7f-723bcf50466c`

This ensures that even if the referrerPolicy fix doesn't work in all browsers, submissions from hayesairecruiting.com always resolve to Hayes Recruiting.

### Technical Details

**Changes to `detectIntegrationSource`** (Priority 0 enhancement):
```typescript
// Priority 0: Check Referer header for /embed/apply path
const refererHeader = req.headers.get('referer') || '';
if (refererHeader.includes('/embed/apply')) {
  return 'Embed Form';
}

// Priority 0.5: Check explicit source field (moved up from Priority 1 for embed reliability)
if (explicitSource && explicitSource.trim() !== '') {
  return explicitSource;
}
```

Moving the explicit source check ABOVE the integration signatures check ensures `source: 'Embed Form'` is always respected before domain-based detection can misclassify it.

**Changes to `INTEGRATION_SIGNATURES`**:
```typescript
'hayesairecruiting.com': { source: 'Hayes Website', requiresScreening: false },
```

**Changes to `SOURCE_ORGANIZATION_OVERRIDES`**:
```typescript
'Hayes Website': '84214b48-7b51-45bc-ad7f-723bcf50466c',
```

After code changes, redeploy the `submit-application` edge function.
