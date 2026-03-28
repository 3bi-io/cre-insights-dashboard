

# Hide Source Badge on /apply for Internal Navigation

## Problem
When a user clicks "Apply" from the `/jobs` page, the apply URL may contain `utm_source` parameters (e.g., `utm_source=cdl_jobcast`) inherited from the job listing's enriched apply URL. This causes the header to display "via Cdl_jobcast" even though the user navigated internally, which looks wrong.

## Solution
In `src/pages/Apply.tsx`, suppress the `source` prop passed to `ApplicationHeader` when the navigation originated from within the app.

### Detection Logic
Check `document.referrer` — if it contains the app's own domain (`applyai.jobs` or `lovable.app`), or is empty (SPA navigation via React Router doesn't set referrer), treat it as internal. Additionally, check for a `ref=internal` or similar marker, but the simplest approach: use React Router's `useLocation` state to detect internal navigation.

**Preferred approach**: When linking from `/jobs` to `/apply`, the app already uses React Router `<Link>` or `navigate()`. We add a `state: { internal: true }` flag on those navigations, then check it on the Apply page.

### Changes

1. **`src/pages/Apply.tsx`** (~3 lines)
   - Import `useLocation` from react-router-dom
   - Check `location.state?.internal` — if true, pass `source={null}` to `ApplicationHeader` instead of the detected source

2. **Job card/detail "Apply" links** (where internal navigation to `/apply` happens)
   - Find all internal `<Link to="/apply?...">` or `navigate('/apply?...')` calls
   - Add `state: { internal: true }` to those navigations

### Files to investigate for navigation sources
- Job cards on `/jobs` page
- Job detail page apply button
- Any other internal links to `/apply`

