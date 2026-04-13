

## Plan: Add Church Transportation ZipRecruiter Conversion Pixel to Thank You Pages

### What This Does
Adds a ZipRecruiter conversion tracking pixel (`enc_account_id=4987c3a9`) that fires **only** when a Church Transportation applicant completes their application **and** the traffic source is ZipRecruiter. This tracks actual conversions, not clicks.

### How It Works

The pixel will render as an invisible 1x1 image on the thank you page only when two conditions are met:
1. The applicant belongs to **Church Transportation** (org ID: `dffb0ef4-07a0-494f-9790-ef9868e143c7`)
2. The traffic source is **ZipRecruiter** (detected via `utm_source` parameter)

### Changes

**1. Create `ChurchZipRecruiterPixel` component** (`src/components/tracking/ChurchZipRecruiterPixel.tsx`)
- Renders `<img src="https://track.ziprecruiter.com/conversion?enc_account_id=4987c3a9" width="1" height="1" />` with off-screen positioning
- Only renders when `organizationId` matches Church Transportation AND `source` contains "ziprecruiter"

**2. Pass `source` and `organizationId` through to ThankYou page**

- **`src/hooks/useApplicationForm.ts`**: Add `source` (from URL `utm_source` param) and `organizationId` to the `/thank-you` navigation state
- **`src/hooks/useDetailedApplicationForm.ts`**: Same — add `source` and `organizationId` to navigation state
- **`src/pages/ThankYou.tsx`**: Extract `source` and `organizationId` from state, render `ChurchZipRecruiterPixel` conditionally

**3. Embed flow** (`src/components/apply/EmbedThankYou.tsx` + `src/pages/EmbedApply.tsx`)
- Add `source` and `organizationId` props to `EmbedThankYou`
- Pass them through from `EmbedApply` submission result
- Render the pixel conditionally in `EmbedThankYou`

### Technical Details
- Church Transportation org ID: `dffb0ef4-07a0-494f-9790-ef9868e143c7`
- Pixel: `https://track.ziprecruiter.com/conversion?enc_account_id=4987c3a9`
- Source detection: checks `utm_source` URL param (matching existing pattern in `useSourceDetection.ts`)
- The existing `ZipRecruiterPixel` (`enc_account_id=8e21fb39`) remains unchanged on the apply pages — it serves a different account
- This new pixel fires post-conversion on thank you pages only, per ZipRecruiter's instructions

