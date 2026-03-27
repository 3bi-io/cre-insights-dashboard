

## Add Shareable Job Preview Link for Client Approval

### What we're building

A "Share Preview" action in the admin jobs dashboard that gives you a copyable link to the job on the live site (`applyai.jobs/jobs/{job_id}`). This lets you send clients a direct link to see exactly how their job listing looks on the public site before or after publishing.

### Current state

- The public route `/jobs/:id` already exists and renders `JobDetailsPage` — this is the live preview.
- The `CopyApplyLinkButton` component already handles copying various apply links but doesn't include a "preview on live site" link.
- The `JobTable.tsx` dropdown menu has placeholder "Edit Job" and "Delete Job" items.

### Changes

**`src/components/jobs/JobTable.tsx`**
- Add a new dropdown menu item: **"Copy Preview Link"** with an `ExternalLink` icon
- On click, copies `https://applyai.jobs/jobs/{job.id}` to clipboard with a toast confirmation
- Add a second item: **"Open on Live Site"** that opens the link in a new tab
- Both use the production domain `applyai.jobs` (not the preview/staging URL)

**`src/components/jobs/CopyApplyLinkButton.tsx`**
- Add a "Live Preview" option to the existing dropdown for consistency when this button is used elsewhere

### Implementation detail

The live site base URL will be defined as a constant (`https://applyai.jobs`) matching the existing `BASE_URL` in `exportJobUrls.ts`. The copy action uses `navigator.clipboard.writeText()` with the existing toast pattern already used throughout the codebase.

