
Fix the public job description renderer so live job pages match the dashboard exactly.

1. Confirmed root cause
- The live site is current and public, so this is not a stale publish issue.
- The job records I checked store the formatted content in `job_summary`, often as full HTML (`<p>`, `<ul>`, `<strong>`), with `job_description` empty.
- The public page renders that content through `renderJobDescription(displayDescription)`.
- `renderJobDescription` always runs header normalization, sentence-to-bullet conversion, and first-line bolding before deciding whether the content is markdown or HTML.
- That transformation is safe for plain text/markdown, but it can corrupt already-formatted HTML and create the “jumbled up” result you’re seeing.

2. What to change
- Update `src/utils/markdownRenderer.ts` so it first detects HTML content and, when HTML is present, skips all markdown/bullet preprocessing and only sanitizes it.
- Keep the current markdown enhancement behavior for plain text and markdown-only descriptions.
- Optionally tighten detection with a dedicated `looksLikeHtml()` helper instead of relying only on markdown detection.

3. Align field usage
- In `src/pages/public/JobDetailsPage.tsx`, keep using the same primary source the dashboard shows for these jobs: `job_summary` when it contains the full formatted description, with `job_description` only used when it is truly the richer field.
- Review the same pattern in:
  - `src/components/JobAnalyticsDialog.tsx`
  - `src/components/public/PublicJobCard.tsx`
  - `src/components/jobs/JobTable.tsx`
- Remove references to `description` on `job_listings` where they are misleading, since the database query confirms that column does not exist in this table.

4. Expected result
- Public `/jobs/:id` pages will preserve paragraph breaks, bold section titles, and bullet lists exactly like the dashboard preview for HTML-backed jobs.
- Plain-text and markdown-fed jobs will still get the improved formatting logic.

5. Files to update
- `src/utils/markdownRenderer.ts`
- `src/pages/public/JobDetailsPage.tsx`
- `src/components/JobAnalyticsDialog.tsx` if needed for consistency
- Any admin/public job components still preferring nonexistent `description` over real job fields

Technical details

```text
Current flow
HTML in job_summary
  -> normalizeInlineHeaders()
  -> convertSentencesToBullets()
  -> boldFirstBullet()
  -> maybe parse as markdown
  -> sanitize
  => HTML can be mangled

Proposed flow
if looksLikeHtml(text):
  sanitize(text) and return
else:
  normalize/convert/bold
  parse markdown if needed
  sanitize
```

Why I’m confident this is the issue
- The live site and published site content match.
- The database contains rich HTML in `job_summary`.
- The renderer currently preprocesses all text before deciding whether it is HTML or markdown.
- The dashboard dialog and the public page both use the renderer, but the public page is the place where the full public-facing job body is most exposed to this mismatch.

Validation after implementation
- Open a job whose `job_summary` contains `<p>` and `<ul>` markup.
- Compare dashboard preview vs live `/jobs/{id}` page.
- Verify bullets, spacing, bold labels, and paragraph breaks match.
- Verify a markdown-based job still renders headings/lists correctly.
