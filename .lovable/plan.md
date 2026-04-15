

## Plan: Add CDL JobCast Tracking Pixel for Admiral Merchants

### Summary
Add a conversion tracking pixel that fires on the thank you page whenever an Admiral Merchants applicant submits their application. The pixel will load an invisible iframe/image pointing to `https://cdljobcast.com/jobform?job_id=y5eVQj5dEP`.

### What Changes

**1. Pass `clientId` through to thank you pages**

Currently, `client_id` exists in the form data but is not forwarded to the thank you page state. We need to thread it through:

- **`useApplicationForm.ts`** — add `clientId: formData.client_id` to the navigate state
- **`useDetailedApplicationForm.ts`** — add `clientId` to the navigate state  
- **`ThankYouState` interface in `ThankYou.tsx`** — add `clientId?: string`
- **`EmbedApply.tsx`** — add `clientId` to `SubmissionResult` interface and pass to `EmbedThankYou`
- **`EmbedThankYou.tsx`** — accept `clientId` prop

**2. Create `AdmiralMerchantsJobCastPixel` component**

New file: `src/components/tracking/AdmiralMerchantsJobCastPixel.tsx`

- Follows exact same pattern as `ChurchZipRecruiterPixel`
- Renders only when `clientId === '53d7dd20-d743-4d34-93e9-eb7175c39da1'` (Admiral Merchants)
- Fires on ALL Admiral Merchants submissions regardless of source
- Renders a 1x1 hidden image pointing to `https://cdljobcast.com/jobform?job_id=y5eVQj5dEP`

**3. Add pixel to both thank you pages**

- `src/pages/ThankYou.tsx` — render `AdmiralMerchantsJobCastPixel` alongside existing Church pixel
- `src/components/apply/EmbedThankYou.tsx` — render `AdmiralMerchantsJobCastPixel` alongside existing Church pixel

### Files Modified
| File | Change |
|------|--------|
| `src/components/tracking/AdmiralMerchantsJobCastPixel.tsx` | New — tracking pixel component |
| `src/hooks/useApplicationForm.ts` | Pass `clientId` to thank you state |
| `src/hooks/useDetailedApplicationForm.ts` | Pass `clientId` to thank you state |
| `src/pages/ThankYou.tsx` | Accept `clientId`, render new pixel |
| `src/components/apply/EmbedThankYou.tsx` | Accept `clientId`, render new pixel |
| `src/pages/EmbedApply.tsx` | Thread `clientId` through to EmbedThankYou |

