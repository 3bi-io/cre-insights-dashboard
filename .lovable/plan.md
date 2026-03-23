

# Add Job Description Preview Tab to Job Details Dialog

## Overview
Add a "Description" tab to the existing `JobAnalyticsDialog` component so admins and clients can preview the full job description directly from the dashboard, verifying it looks correct without leaving the admin/client portal.

## Changes

### 1. Update `JobAnalyticsDialog.tsx`
- Add a 4th tab called "Description" (with a `FileText` icon) to the existing tabs (Analytics, Feed Data, Embed Widgets)
- Change the grid from `grid-cols-3` to `grid-cols-4`
- The new tab content will:
  - Show `job_summary` (if present) in a highlighted summary card at the top
  - Render the full `job_description` (or `description`) using `dangerouslySetInnerHTML` since job descriptions often contain HTML markup
  - Include a fallback "No description available" empty state
  - Add a "Preview as Public" button that opens the public `/jobs/{id}` page in a new tab
- Update the `JobAnalyticsDialogProps` interface to include `job_description`, `job_summary`, and `description` fields

### 2. No other file changes needed
The `JobTable` already passes the full job object (with `[key: string]: unknown`) to the dialog, so `job_description` and `job_summary` will be available. The client dashboard reuses the same components.

## Technical Details
- Job descriptions from feeds are typically HTML. We'll render them inside a `prose` container with Tailwind typography styles for clean formatting.
- The dialog already has `max-h-[80vh] overflow-y-auto`, so long descriptions will scroll naturally.

