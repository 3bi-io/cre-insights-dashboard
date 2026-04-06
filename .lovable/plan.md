

# Add `previewDate` Override to Morning Digest

## What This Does
Adds an optional `previewDate` parameter (e.g. `"2026-04-04"`) so you can render the morning digest email against any historical date's callback data, not just today. Also relaxes the `digest_email_sent` filter when previewing so already-sent callbacks are included.

## Changes

### File: `supabase/functions/morning-digest/index.ts`

1. **Parse `previewDate` from request body** (after line 56):
   - Accept `body.previewDate` as an optional `YYYY-MM-DD` string
   - Validate format with a regex (`/^\d{4}-\d{2}-\d{2}$/`)

2. **Use `previewDate` instead of today when provided** (lines 67-78):
   - If `previewDate` is set, use it directly as `centralDate` instead of deriving from `new Date()`
   - The rest of the UTC boundary logic stays the same

3. **Skip `digest_email_sent` filter in preview mode** (line 89):
   - When `action === 'preview'`, omit `.eq('digest_email_sent', false)` so historical callbacks that were already digested are still returned

### Summary of code changes:
```
Body parsing:   + previewDate = body.previewDate || null
Validation:     + regex check on previewDate format
Date derivation: centralDate = previewDate || Intl.DateTimeFormat(...)
Query filter:    conditionally apply digest_email_sent filter only when action !== 'preview'
```

One file changed, ~10 lines added.

