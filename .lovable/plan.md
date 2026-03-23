

# Improve R.E. Garrison Job Description Formatting

## Problem
1. The top summary line isn't bold/prominent
2. "Weekly Deductions" section has comma-separated items (e.g., "Bobtail $6.69/wk, Workers Comp $50/wk, ...") that should be bullet points
3. Need a bold "Summary" label at the top

## Changes

### Update `src/utils/markdownRenderer.ts`

1. **Add bold "Summary" header**: Insert a `## Summary` header before the first line of text (if it doesn't already start with a header). This makes the top section clearly labeled and bold.

2. **Convert comma-separated lists to bullets**: Add logic in the pre-processing step to detect lines with 3+ comma-separated segments (each ≥10 chars) — similar to the existing sentence splitter but targeting `, ` delimiters. This will turn "Bobtail $6.69/wk, Workers Comp $50/wk, Equipment deposit $150/wk..." into individual bullet points.

3. **Bold the first content line**: Wrap the first non-header, non-empty line in `**...**` markdown bold so the top-line summary stands out visually.

### No other files change
All rendering goes through `renderJobDescription()` already.

