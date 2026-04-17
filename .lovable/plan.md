

## Plan: Remove ZipRecruiter Pixel from Apply Page

### Problem
`ZipRecruiterPixel` fires on `/apply` (page load) AND on `/thank-you` (post-submit). Double-firing inflates conversions and corrupts ZipRecruiter attribution data.

### Solution
Remove the pixel from the apply page entirely. Keep it firing only on `/thank-you` after a successful submission.

### Affected file
**`src/pages/Apply.tsx`**
- Remove the `import ZipRecruiterPixel from '@/components/tracking/ZipRecruiterPixel';` line.
- Remove the `{!isOutsideAmericas && <ZipRecruiterPixel />}` render at the bottom of the component.

### What does NOT change
- `src/components/tracking/ZipRecruiterPixel.tsx` — kept as-is (still used on Thank You page).
- Thank You page pixel firing — unchanged (per memory `mem://features/post-conversion-tracking-pixels`, conversions only count on `/thank-you`).
- Geo-blocked flow — unchanged (was already excluded).
- `SocialExpressForm`, `SimulatedApplicationForm`, `ApplicationForm` — unchanged.

### Verification after change
- Load `/apply?...` → no request to `track.ziprecruiter.com/conversion`.
- Submit application → land on `/thank-you` → exactly one request to `track.ziprecruiter.com/conversion`.

