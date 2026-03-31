

# Fix: Hayes Inbound Application Status Constraint Violation

## Root Cause
The `applications` table has a CHECK constraint (`applications_status_check`) that only allows: `pending`, `reviewed`, `interviewed`, `hired`, `rejected`.

The `processApplication` function in `hayes-client-handler.ts` (line 292) sets `status: 'new'`, which violates this constraint — causing every POST to `/hayes-inbound?client=re-garrison` to fail with a 400 error.

## Fix
One-line change in `supabase/functions/_shared/hayes-client-handler.ts`:

Change line 292 from:
```typescript
status: 'new',
```
to:
```typescript
status: 'pending',
```

This aligns with the database constraint and matches the semantics — a freshly submitted application is "pending" review.

## Verification
After the fix, re-send the Mick Foley test application via `POST /hayes-inbound?client=re-garrison` and confirm a 200 response with an `applicationId`.

