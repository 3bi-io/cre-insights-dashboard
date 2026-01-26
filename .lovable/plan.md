

# CDL Job Cast Integration Audit + Fixes

## Summary

After reviewing all CDL Jobcast applications for Hayes Recruiting, the integration is **working correctly for core data capture** but has **gaps in CDL-specific fields**.

---

## Audit Results

### Data Quality Analysis

| Metric | Status | Details |
|--------|--------|---------|
| Total CDL Job Cast Applications | 48 | All successfully stored |
| Client Routing | Working | Danny Herman: 42, Pemberton: 6 |
| Contact Info (name, email, phone) | Complete | All 48 have full contact data |
| Location Data (city, state, zip) | Complete | All 48 have location |
| CDL Status Field | Missing | 0/48 have cdl field populated |
| Experience Field | Missing | 0/48 have exp field populated |
| Job Matching | Fallback | All 48 routed to "General Application" |

### Why CDL/Experience Fields Are Missing

The `inbound-applications` edge function attempts to extract CDL data using these field names:

```text
cdl: ['cdl', 'cdl_license', 'has_cdl']
exp: ['exp', 'experience', 'years_experience', 'yearsExperience']
```

CDL Jobcast likely sends these fields with different names that we haven't mapped. Common variations include:
- `cdl_a`, `class_a_cdl`, `has_class_a`
- `driving_experience`, `months_experience`, `experience_months`

### Why Job Matching Falls Back to General Application

1. CDL Jobcast sends job references like `13980J12866`
2. Our job_listings have feed-synced job_ids like `14294J4689`
3. The formats use different suffix patterns
4. Since exact match fails, system creates "General Application" entries

**This is actually acceptable behavior** - the client routing still works via the 5-digit prefix.

---

## Recommended Fixes

### Phase 1: Expand CDL Field Mapping

**File: `supabase/functions/inbound-applications/index.ts`**

Add additional field name variations for CDL-related data:

```typescript
// Current
cdl: extractValue(body, ['cdl', 'cdl_license', 'has_cdl']),
exp: extractValue(body, ['exp', 'experience', 'years_experience', 'yearsExperience']),

// Expanded to include common CDL Jobcast field names
cdl: extractValue(body, [
  'cdl', 'cdl_license', 'has_cdl', 
  'cdl_a', 'class_a_cdl', 'has_class_a', 'cdl_status',
  'ClassACDL', 'class_a', 'has_cdl_a'
]),
exp: extractValue(body, [
  'exp', 'experience', 'years_experience', 'yearsExperience',
  'driving_experience', 'months_experience', 'experience_months',
  'DrivingExperience', 'cdl_experience', 'trucking_experience'
]),
```

### Phase 2: Add Payload Logging for CDL Jobcast

**File: `supabase/functions/inbound-applications/index.ts`**

Add detailed logging when source is CDL Job Cast to capture the exact field names they send:

```typescript
// After source detection
if (applicationData.source === 'CDL Job Cast') {
  logger.info('CDL Job Cast payload analysis', {
    allFieldNames: Object.keys(body),
    potentialCDLFields: Object.entries(body)
      .filter(([key]) => key.toLowerCase().includes('cdl') || 
                         key.toLowerCase().includes('experience') ||
                         key.toLowerCase().includes('license'))
  });
}
```

### Phase 3: Improve Location-Based Job Matching

**File: `supabase/functions/_shared/application-processor.ts`**

When job_id doesn't match exactly, attempt city/state matching before falling back to General Application:

```typescript
// Already implemented at lines 231-256, but verify it's being triggered
// The location_fallback matchType should be used more often
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/inbound-applications/index.ts` | Expand CDL field extraction mappings, add payload logging |
| `supabase/functions/_shared/application-processor.ts` | Verify location-based fallback is working |

---

## Verification Plan

After deployment:
1. Check edge function logs for CDL Job Cast payload analysis
2. Verify new applications have CDL and exp fields populated
3. Monitor job matching to see if location fallback improves matching rates

---

## Data Remediation (Optional)

If CDL Jobcast is sending CDL/exp data but with unmapped field names, we may need to:
1. Request a sample payload from CDL Jobcast to identify exact field names
2. Or check the raw request logs if available

---

## Expected Outcome

After implementation:
- New CDL Job Cast applications will capture CDL and experience data if provided
- Better logging will reveal exact payload structure for further optimization
- Existing data quality for contact/location info remains unaffected

