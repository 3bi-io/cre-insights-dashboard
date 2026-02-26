

## Remove "Back to Home" Links from All Apply Pages

### Problem
All public-facing apply pages contain "Back to Home" links that navigate to the main marketing site (`/`). For a recruitment platform, these links create unnecessary exit points that reduce application completion rates.

### Pages Affected

| File | Element | Location |
|------|---------|----------|
| `src/pages/Apply.tsx` | "Back to Home" link with arrow icon | Bottom of form (lines 94-103) |
| `src/pages/ThankYou.tsx` | "Back to Home" button | Post-submission card (lines 80-86) |
| `src/features/auth/pages/ApplyPage.tsx` | "Back to Home" arrow link | Bottom of form (lines 12-19) |

### Already Clean (No Changes Needed)
- `src/pages/EmbedApply.tsx` -- no home link
- `src/components/apply/EmbedThankYou.tsx` -- no home link (only "Powered by" branding)

### Changes

**1. `src/pages/Apply.tsx`** -- Remove the entire `<nav>` block (lines 94-103) containing the "Back to Home" link. Also remove the unused `ArrowLeft` icon import and `Link` import if no longer referenced.

**2. `src/pages/ThankYou.tsx`** -- Remove the `<div className="space-y-4">` block (lines 80-87) containing the "Back to Home" button. Also clean up unused `ArrowLeft` and `Link` imports.

**3. `src/features/auth/pages/ApplyPage.tsx`** -- Remove the `<div className="text-center mt-6 pb-6">` block (lines 12-19) containing the "Back to Home" link. Remove the unused `Link` import from line 2.

### Impact
- Reduces funnel drop-off on `/apply` and `/thank-you`
- Keeps embed pages unchanged (already correct)
- No functional impact on form submission or navigation flow
