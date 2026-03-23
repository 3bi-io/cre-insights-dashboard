

# Hide Voice Apply for External-URL Jobs

## Approach
The simplest fix: hide the "Apply with Voice" button whenever a job has an external `apply_url`. This covers all 3 jobs and any future external-apply jobs — voice apply doesn't make sense when the application process lives on another site.

## Changes

### 1. `src/components/public/PublicJobCard.tsx`
Add `isExternalApply` to the `showVoiceButton` condition so voice button is hidden for external jobs.

### 2. `src/pages/public/JobDetailsPage.tsx`
Pass `showVoiceButton={!isExternalApply}` to `JobSidebar` and `StickyApplyCTA`, hiding the voice button on the detail page too.

### 3. `src/features/jobs/components/public/JobSidebar.tsx`
Accept optional `showVoiceButton` prop (default `true`), conditionally render the voice button.

### 4. `src/components/public/StickyApplyCTA.tsx`
Already has `showVoiceButton` prop — no change needed, just needs correct value from parent.

