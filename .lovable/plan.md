
## Fix: Consent Section Progress Indicator

### Problem
The progress indicator is hardcoded to 4 steps (Personal, CDL, Background, Consent). When screening questions exist for a job listing, the form has 5 actual steps, but the progress bar still shows only 4. This causes:
- Step 4 displays "Consent" in the header but actually shows Screening Questions
- Step 5 (the real Consent step) is unreachable via the progress indicator
- The progress bar shows "Step 4 of 4" when there are really 5 steps

### Solution
Make the `FormProgressIndicator` dynamic by accepting a `hasScreening` prop. When screening questions are present, insert a "Screening" step (with a clipboard icon) between Background and Consent, showing 5 steps total.

### Changes

**1. `src/components/apply/FormProgressIndicator.tsx`**
- Add `hasScreening` prop to the component interface
- Build the steps array dynamically: when `hasScreening` is true, insert a "Screening" step (using `ClipboardList` icon) at position 4, pushing Consent to position 5
- Update the mobile "Step X of Y" display to use the dynamic array length instead of the hardcoded `steps.length`

**2. `src/components/apply/ApplicationForm.tsx`**
- Pass `hasScreening={!!hasScreening}` to `FormProgressIndicator`
