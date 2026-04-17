

## Plan: Move Job Description Below Application Form

### Change
In `src/pages/Apply.tsx`, move the `<JobDescriptionPanel />` from above the form to below it (still inside the same `max-w-2xl` container, after the `<main>` block).

### Why it still works for Indeed
The description stays rendered in the page DOM on initial load (not behind a tab/modal/JS interaction), so Indeed's crawler still sees the content. Position on the page does not affect compliance — only presence does.

### Affected file
- `src/pages/Apply.tsx` — relocate the `{showJobDescription && !isOutsideAmericas && (<JobDescriptionPanel ... />)}` block from above `<main>` to immediately after `</main>`.

### What does NOT change
- `JobDescriptionPanel.tsx` — unchanged.
- `useApplyContext.ts` — unchanged.
- Allow-list (`jobDescriptionClients.ts`) — unchanged.
- Geo-blocked / simulated flow — still skips the panel.
- Mobile collapsible "Read more" behavior — unchanged.

