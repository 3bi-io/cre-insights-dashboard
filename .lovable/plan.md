

# Convert Sentence-Style Job Descriptions to Bullet Points

## Problem
R.E. Garrison job descriptions have details packed into long sentences separated by periods (e.g., "Earn $4,000-$5,000 gross weekly. 70% of line haul + 100% of billed fuel surcharge. No trailer rental."). These render as dense paragraphs instead of scannable bullet points.

## Solution
Add a pre-processing step in `markdownRenderer.ts` that splits sentence-packed paragraphs into markdown bullet lists before passing to `marked`.

## Changes

### Update `src/utils/markdownRenderer.ts`
Add a `convertSentencesToBullets()` function that runs before markdown parsing:

- **Target only non-header, non-table paragraphs** — lines that don't start with `#`, `|`, `-`, `*`, or digits followed by `.`
- **Split on `. ` or `, ` boundaries** where each segment is a distinct fact/benefit (minimum ~15 chars to avoid splitting things like "e.g., this")
- **Prefix each segment with `- `** to create a markdown unordered list
- **Preserve headers, tables, and existing lists** untouched

For example, this input:
> Earn $4,000-$5,000 gross weekly. 70% of line haul + 100% of billed fuel surcharge. No trailer rental.

Becomes:
> - Earn $4,000-$5,000 gross weekly
> - 70% of line haul + 100% of billed fuel surcharge
> - No trailer rental

The function processes the text line-by-line, only converting lines that contain 3+ sentence-ending periods and aren't already formatted.

### No other files change
The rendering components already call `renderJobDescription()` — the formatting improvement flows through automatically.

