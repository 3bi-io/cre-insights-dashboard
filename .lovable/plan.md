

## Plan: Re-queue Failed API Key Outbound Calls

### Summary

13 legitimate applicants had their outbound calls fail due to the invalid ElevenLabs API key (`401 invalid_api_key`). These applicants have no successful or pending calls and need to be re-queued so the system retries them with the new working key.

2 test/junk records will be excluded: "Artemas Peck" (+10000000000) and "blah blah" (+11212555999).

### Applicants to Re-queue

| Name | Phone | 
|------|-------|
| Carolyn Askew | +14796700892 |
| Dale Bennett | +19379740610 |
| Darius Brown | +18036698271 |
| Devon Smith | +12525582521 |
| Domingo Saucedo | +19038178892 |
| Donna Davis | +17345529679 |
| JaMichael Smith | +16592524151 |
| Joseph Cotton | +11229733983 |
| Lucy Hulon | +19106510751 |
| Shaun Nichols | +16823753104 |
| Stephen Baugus | +19109166514 |
| Stephen MacNeil | +13863022701 |
| Steve Lewis | +16787704046 |

### Steps

1. **Insert 13 new outbound_calls records** with `status = 'queued'`, `retry_count = 0`, preserving the original `application_id`, `voice_agent_id`, `organization_id`, and `phone_number`. Metadata will note `triggered_by: 'requeue_api_key_fix'`.

2. **Redeploy the `elevenlabs-outbound-call` edge function** to ensure it picks up the updated `ELEVENLABS_API_KEY` secret (per the deployment standards memory).

3. The existing cron job (runs every minute) will automatically pick up the new queued calls and process them with the working API key.

### Technical Details

- New calls are inserted as fresh queue entries rather than updating the failed records, to preserve the audit trail of the original failures.
- The `scheduled_at` field will be set to `now()` so they are immediately eligible for processing.
- The edge function redeploy is critical: without it, the function may still use the cached old API key.

