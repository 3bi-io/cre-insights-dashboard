

## Plan: Retry 4 Failed Double Nickel Deliveries

### Context
The `resolveTrackingLinkId` fix has been applied but the edge function needs to be redeployed before retrying. Once deployed, we retry each failed application via the existing `ats-integration` edge function's `send_application` action.

### Steps

#### 1. Deploy the updated `ats-integration` edge function
The fix is in the shared adapter code used by this function. Deploy it so the tracking link resolution works correctly.

#### 2. Retry each failed application
Call the `ats-integration` edge function 4 times with `action: 'send_application'` for each application ID against connection `b531dbe2-278c-47b7-a39b-f951d3e3d6cc`:
- `a8d92b5a-a947-42e7-ace5-3e0e6d547bcc` (Randy Henderson)
- `f0516cc6-c716-4602-b655-fd44632396c0` (Jen Wessell)
- `839ffe77-7335-47b6-a864-4a33dc32b073` (K m)
- `b92721d6-85c5-479a-b5be-f6c6921015ff` (Christopher J)

#### 3. Verify results
Check the `ats_sync_logs` table for new entries to confirm each retry succeeded.

### Technical details
- Uses existing `supabase.functions.invoke('ats-integration', { body: { action: 'send_application', connection_id, application_id } })`
- No code changes needed — only deployment + invocation
- The fix in `rest-json-adapter.ts` (Array.isArray check) will now correctly resolve the tracking link ID from the JSONB array

### Files changed: 0
This is an operational task (deploy + invoke), no code changes required.

