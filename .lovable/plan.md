# Unified CDL Job Cast Inbound URLs for Hayes Clients

## Goal
Provide working `hayes-inbound?client=<key>` URLs (matching the proven `re-garrison` pattern) for all 7 requested clients so CDL Job Cast can post applications into our system.

## Current State
`HAYES_CLIENT_CONFIGS` in `supabase/functions/_shared/hayes-client-handler.ts` already has entries for:
- `pemberton`, `danny-herman`, `james-burg`, `harpers-hotshot` (and `re-garrison`, `dayross`, `novco`)

Missing entries: **Admiral Merchants**, **Trucks For You Inc**, **RG Transport**.

## Changes

### 1. Add 3 new client configs to `HAYES_CLIENT_CONFIGS`
Append to `supabase/functions/_shared/hayes-client-handler.ts`:

```ts
'admiral-merchants': {
  clientId: '53d7dd20-d743-4d34-93e9-eb7175c39da1',
  clientName: 'Admiral Merchants',
  clientSlug: 'admiral-merchants',
  feedUserCode: 'TBD', // Request from CDL Job Cast
  feedBoard: 'AIRecruiter',
},
'trucks-for-you': {
  clientId: 'cc4a05e9-2c87-4e71-b7f5-49d8bd709540',
  clientName: 'Trucks For You Inc',
  clientSlug: 'trucks-for-you',
  feedUserCode: 'TBD',
  feedBoard: 'AIRecruiter',
},
'rg-transport': {
  clientId: 'dfef4b27-311a-4eee-91cc-4bf57694268e',
  clientName: 'RG Transport',
  clientSlug: 'rg-transport',
  feedUserCode: 'TBD',
  feedBoard: 'AIRecruiter',
},
```

Note: `feedUserCode` is only used for outbound job sync (GET `?action=jobs`). Inbound application POSTs from CDL Job Cast do NOT require it, so the URLs work immediately for receiving applications. Pull/sync needs the codes filled in later.

### 2. Redeploy `hayes-inbound`
Deploy so the new client keys are recognized by the parameterized endpoint.

### 3. Verify
Smoke-test each new URL with a GET to confirm the client key is accepted (expect proper response, not "Unknown client").

## Final URLs (give to CDL Job Cast)

```
Admiral Merchants:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=admiral-merchants

Pemberton Truck Lines:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=pemberton

Danny Herman Trucking:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=danny-herman

Trucks For You Inc:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=trucks-for-you

Harpers Hotshot:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=harpers-hotshot

RG Transport:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=rg-transport

James Burg Trucking Company:
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/hayes-inbound?client=james-burg
```

All applications routed through these URLs will be tagged to the correct `clientId`, get UTM `utm_campaign=<slug>`, and (for the Hayes org) automatically dispatched to the ApplyAI outbound webhook via the centralized helper added previously.

## Follow-up (not blocking)
Request CDL Job Cast `feedUserCode` values for Admiral Merchants, Trucks For You, RG Transport, and Harpers Hotshot to enable outbound job pulls.
