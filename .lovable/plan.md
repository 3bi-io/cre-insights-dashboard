

# Update Email BCC Recipients

## Change Summary

Modify the email review BCC list to keep only `codyforbes@gmail.com`, removing the other three recipients.

## Current Configuration

```typescript
reviewBcc: [
  "andrew@aspenanalytics.io",      // REMOVE
  "codyforbes@gmail.com",          // KEEP
  "truckinjimmyhayes@gmail.com",   // REMOVE
  "craig@careernowbrands.com"      // REMOVE
]
```

## New Configuration

```typescript
reviewBcc: [
  "codyforbes@gmail.com"
]
```

## File to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/email-config.ts` | Update `reviewBcc` array (lines 24-29) |

## Impact

All outgoing system emails will now only BCC to `codyforbes@gmail.com`:
- Invitation emails
- Contact form notifications
- Auth email templates (magic links, password resets, etc.)
- Application status updates

