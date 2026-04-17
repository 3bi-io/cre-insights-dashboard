

## Plan: Show Job Description Above Short Application (Indeed Compliance Fix)

### Problem
Indeed flags the short application page (`/apply?job_id=...`) for missing job description content. For **Danny Herman**, **Pemberton**, and **Admiral Merchants**, the page only shows job title + client name + form, but no description body. Indeed crawlers need visible description text on the apply page.

### Solution
Render the job's `description` / `job_summary` (already in `job_listings`) in a collapsible block placed **between** the `ApplicationHeader` and the `ApplicationForm`, gated to these three clients only (so we don't disrupt other client experiences).

### Affected Files

1. **`src/hooks/useApplyContext.ts`**
   - Add `jobDescription` and `jobSummary` to context.
   - In the Priority 1 fetch, also select `description, job_summary` from `job_listings`.

2. **`src/components/apply/JobDescriptionPanel.tsx`** (new)
   - Renders the description using the existing `markdownRenderer` (HTML-first, per memory `mem://ui/job-description-rendering-and-formatting`).
   - Collapsed by default on mobile (max-height + "Read more" toggle), fully expanded on desktop.
   - Visually clean: bordered card, muted background, `prose` typography, no form-distracting styling.
   - SEO-friendly: content rendered in DOM (not behind a tab/modal) so Indeed crawlers see it.

3. **`src/pages/Apply.tsx`**
   - Pull `clientId`, `jobDescription`, `jobSummary` from `useApplyContext`.
   - Define an allow-list of client IDs:
     - Danny Herman, Pemberton, Admiral Merchants (`53d7dd20-d743-4d34-93e9-eb7175c39da1`).
   - Render `<JobDescriptionPanel />` between `ApplicationHeader` and the form **only when** `clientId` is in the allow-list AND description content exists.
   - Skip rendering for the simulated (geo-blocked) and embed flows.

### Layout

```text
┌──────────────────────────────┐
│   ApplicationHeader          │  ← logo, title, location
├──────────────────────────────┤
│   JobDescriptionPanel (NEW)  │  ← collapsible markdown/HTML block
│   "About this role"          │     (only for 3 clients)
├──────────────────────────────┤
│   ApplicationForm            │  ← existing short form
└──────────────────────────────┘
```

### Why an allow-list (not all clients)
- Avoids regression risk for clients whose UX is intentionally minimal.
- Targets exactly the Indeed-flagged carriers.
- Easy to expand later by adding client IDs to a single constant.

### Technical Details
- No DB migration needed — `job_listings.description` and `job_listings.job_summary` already exist.
- Reuse existing `markdownRenderer.ts` utility (HTML-first detection already in place).
- Allow-list constant lives in `src/components/apply/jobDescriptionClients.ts` for clarity.
- Client IDs to confirm during implementation:
  - Admiral Merchants: `53d7dd20-d743-4d34-93e9-eb7175c39da1` (from memory)
  - Danny Herman + Pemberton: resolve via DB query at implementation time (under Hayes Recruiting org).
- No changes to the `submit-application` edge function or routing logic.

