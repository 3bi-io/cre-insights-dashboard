

# Fix Job Description Formatting

## Problems
1. "Summary" appears twice (light + bold) — the `## Summary` header renders as a heading, but there may also be a `job_summary` field shown separately above
2. First content line stays as a dense paragraph because bolding runs first, which causes the bullet converter to skip it
3. Need: single "Summary" label, first line bold, rest as normal bullets

## Changes

### Update `src/utils/markdownRenderer.ts`

1. **Swap processing order**: Run `convertSentencesToBullets()` BEFORE `addSummaryHeader()` so the dense paragraph gets split into bullets first

2. **Fix `addSummaryHeader()`**: Instead of bolding the entire first content line, bold only the first bullet point's text (the `- ` prefix stays outside the bold). If the first content line is already a bullet (`- `), wrap just its text in bold.

3. **Fix `isStructuredLine()`**: Remove the `/^\*\*/` check that incorrectly skips bold lines from bullet conversion

4. **Check for duplicate "Summary"**: The `job_summary` field may already be rendered separately in the component. Need to verify if the `## Summary` header is causing duplication — if the component already shows a "Summary" label, remove the auto-inserted header from the renderer.

### Verify `JobDetailsPage.tsx` and `JobAnalyticsDialog.tsx`
Check if these components already display a "Summary" heading above the rendered content, which would explain the duplication. If so, remove the `## Summary` injection from the renderer and just bold the first bullet.

