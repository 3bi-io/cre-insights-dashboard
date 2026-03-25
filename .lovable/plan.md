

## Double Nickel ATS Integration Plan

### What is Double Nickel?
Double Nickel is a REST-based ATS for the trucking industry. Their API uses Auth0 OAuth tokens (client_credentials grant) with a 24-hour TTL, and exposes a single `POST /applicants` endpoint.

### Key API Details

```text
Auth:     Auth0 client_credentials → Bearer token (24h TTL, must cache)
Test URL: https://dashboard-test.getdoublenickel.com/api/applicants
Prod URL: https://dashboard.getdoublenickel.com/api/applicants
Rate:     5 req/sec

Required fields: firstName, lastName, phone, email, trackingLinkId, companyId
Optional fields: middleName, cdlExperience, zipCode
```

### Integration Architecture

The platform already has a well-structured ATS adapter system (`BaseATSAdapter` → `RESTJSONAdapter`). Double Nickel fits naturally as a `rest_json` adapter with one twist: it requires an OAuth token exchange before each call (cached for 24 hours), unlike the simpler API-key-based adapters.

### Implementation Steps

**1. Register Double Nickel in the adapter factory**
- Add `doublenickel` to `getSystemBySlug()` in `supabase/functions/_shared/ats-adapters/index.ts`
- Category: `trucking`, API type: `rest_json`, supports test mode: `true`
- Base endpoints for test and production environments

**2. Add Double Nickel request builders to `RESTJSONAdapter`**
- `buildDoubleNickelHeaders()` — constructs `Authorization: Bearer <token>` + `auth-provider: auth0`
- `buildDoubleNickelPayload()` — maps internal `ApplicationData` fields to Double Nickel's camelCase format (`firstName`, `lastName`, `phone`, `email`, `cdlExperience`, `zipCode`, `trackingLinkId`, `companyId`)
- Add cases to `buildTestRequest()`, `buildApplicationRequest()`, and `extractExternalId()` for the `doublenickel` slug

**3. OAuth token caching layer**
- Add a helper function `getDoubleNickelToken(credentials, mode)` that:
  - Calls the appropriate Auth0 token URL (`double-nickel-test.us.auth0.com` or `double-nickel.us.auth0.com`)
  - Posts `client_id`, `client_secret`, `audience` from the connection credentials
  - Caches the token in memory with its expiry (24h) to avoid unnecessary token requests
- Integrate this into the header builder so tokens are fetched/reused automatically

**4. Credential schema definition**
- Define the credential fields that admins will fill in when setting up a Double Nickel connection:
  - `client_id` (string, required) — Auth0 client ID
  - `client_secret` (password, required) — Auth0 client secret
  - `audience` (string, required) — Auth0 audience
  - `companyId` (string, required) — Double Nickel company ID
  - `trackingLinkId` (string, required) — Source tracking identifier

**5. Add to frontend platform config** (optional)
- Add `doublenickel` to `ORGANIZATION_PLATFORMS` in `organizationPlatforms.config.ts` under the Trucking category
- Add to `PlatformKey` type if clients should be able to enable/disable it

**6. Field mapping**
```text
Internal Field        →  Double Nickel Field
─────────────────────────────────────────────
first_name            →  firstName
middle_name           →  middleName
last_name             →  lastName
phone                 →  phone
applicant_email       →  email
driving_experience    →  cdlExperience (float)
zip                   →  zipCode
(from credentials)    →  trackingLinkId
(from credentials)    →  companyId
```

**7. Fix existing dead code**
- Remove the duplicate `return new RESTJSONAdapter(config);` line in the `default` case of `createATSAdapter()` (line 44 of `index.ts`)

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/_shared/ats-adapters/index.ts` | Add `doublenickel` to system configs, fix dead code |
| `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` | Add DN header/payload builders and switch cases |
| `supabase/functions/_shared/ats-adapters/types.ts` | Add DN-specific credential fields if needed |
| `src/features/organizations/config/organizationPlatforms.config.ts` | Add `doublenickel` platform entry |
| `src/features/organizations/types/platforms.types.ts` | Add `'doublenickel'` to `PlatformKey` union |

### Secrets Required
Three secrets will need to be stored per connection in the `ats_connections.credentials` JSON column (not as edge function secrets):
- `client_id`, `client_secret`, `audience` — all provided by Double Nickel per environment

