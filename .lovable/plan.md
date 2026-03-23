

# Render Markdown Job Descriptions Properly

## Problem
R.E. Garrison job descriptions are stored as **markdown** in `job_summary` (with `##` headers, `|` pipe tables, `**` bold, `###` sections). The app currently renders them via `dangerouslySetInnerHTML` which only handles HTML — so the markdown syntax appears as raw text.

## Solution
Install a markdown-to-HTML library and convert markdown content before sanitizing and rendering.

## Changes

### 1. Install `marked` library
Add `marked` — a fast, lightweight markdown parser that converts markdown to HTML. Works well with the existing DOMPurify sanitization pipeline.

### 2. Create a markdown rendering utility (`src/utils/markdownRenderer.ts`)
- Import `marked` and `DOMPurify`
- Export a `renderMarkdown(text: string): string` function that:
  - Detects if content looks like markdown (contains `#`, `|`, `**`, `- `, etc.) vs. plain HTML
  - If markdown: parse with `marked`, then sanitize with DOMPurify
  - If HTML: sanitize with DOMPurify directly (existing behavior)
- This keeps backward compatibility for jobs that already have HTML descriptions

### 3. Update rendering locations
- **`JobDetailsPage.tsx`** — use `renderMarkdown()` instead of `sanitizers.sanitizeHtml()` for the description
- **`PublicJobCard.tsx`** — same change for the card preview snippet
- **`JobAnalyticsDialog.tsx`** — same change for the admin/client description preview tab

All three locations currently use `dangerouslySetInnerHTML` with sanitization, so the only change is swapping the processing function. The existing `prose` CSS classes on `JobDetailsPage` will automatically style the generated HTML (headers, tables, lists, bold text) correctly.

