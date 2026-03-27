

## Fix: UI locks up after closing job view/edit dialogs

### Root cause

Two issues in `JobTable.tsx` and `JobsPage.tsx` combine to freeze the page:

1. **Radix DropdownMenu + Dialog focus conflict**: When "View Details" or "Edit Job" is clicked from the `DropdownMenu`, the dropdown closes and tries to return focus to the trigger button. Simultaneously, the Dialog tries to trap focus. This creates a focus deadlock that makes the page unresponsive. This is a [known Radix UI issue](https://github.com/radix-ui/primitives/issues/1241).

2. **`selectedJob` never cleared on dialog close**: In `JobsPage.tsx` line 287, the analytics dialog is conditionally rendered with `{selectedJob && (`. When the dialog closes, `showAnalyticsDialog` becomes `false` but `selectedJob` stays set, leaving a hidden `Dialog` mounted with `open={false}`. Radix's body scroll/pointer-events lock can linger.

3. **"Edit Job" has no handler**: The "Edit Job" dropdown item (line 476-479 in `JobTable.tsx`) has no `onClick` — it's a dead button.

### Changes

**`src/components/jobs/JobTable.tsx`**
- Add `onCloseAutoFocus={(e) => e.preventDefault()}` to `DropdownMenuContent` — prevents the focus return that conflicts with dialogs
- Wire up "Edit Job" dropdown item with a proper callback (or remove it if not needed)

**`src/features/jobs/pages/JobsPage.tsx`**
- Clear `selectedJob` when the analytics dialog closes:
  ```tsx
  const handleAnalyticsOpenChange = (open: boolean) => {
    setShowAnalyticsDialog(open);
    if (!open) setSelectedJob(null);
  };
  ```
- Pass `handleAnalyticsOpenChange` instead of `setShowAnalyticsDialog` to `JobAnalyticsDialog`

### What this fixes
- No more frozen/locked screen after closing the job details dialog
- Clean unmount of the dialog component when closed
- Focus returns properly to the page instead of getting trapped

