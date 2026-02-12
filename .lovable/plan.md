
# Reset ATS Connection Statuses

## What
Update two ATS connections from `error` to `active` status and clear their last error messages so they're ready for re-testing.

| Connection | Client | Company ID | Current Status |
|-----------|--------|-----------|----------------|
| Danny Herman Trucking | `6b164de1-15d0-4164-9f3e-f66f56c7cc19` | 1658 | error -> **active** |
| Day & Ross | needs lookup | 2829 | error -> **active** |

## How
Two simple data UPDATEs (no schema changes):

```sql
UPDATE ats_connections
SET status = 'active',
    last_error = NULL,
    updated_at = now()
WHERE id IN (
  '6b164de1-15d0-4164-9f3e-f66f56c7cc19',  -- Danny Herman
  (SELECT id FROM ats_connections 
   WHERE credentials->>'company_id' = '2829' 
   AND status = 'error' 
   LIMIT 1)                                  -- Day & Ross
);
```

## Scope
- Two row updates in `ats_connections`, no code or schema changes
- Clears `last_error` so the next auto-post attempt starts clean
- No file modifications required
