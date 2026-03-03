

# Organization External Data Integration — Advisory & Plan

## What You Already Have

Your platform already has a solid foundation for this:

1. **`organization-api` edge function** — A REST API authenticated via `x-api-key` header, exposing `/clients`, `/jobs`, `/applications`, and `/stats` endpoints scoped to the organization.
2. **`org_api_keys` table** — Stores API keys per organization with RLS policies restricting management to org admins and super admins.
3. **`APIKeyManager` component** — Dashboard UI for admins to generate/revoke API keys.
4. **CORS whitelist** — Currently hardcoded to Hayes AI Recruiting domains + Lovable preview domains.

This is already a working integration used by Hayes AI Recruiting on `hayesairecruiting.com`.

---

## Recommendations to Make This Production-Ready for All Organizations

### 1. Dynamic CORS Origin Management

**Problem**: The `ALLOWED_ORIGINS` array is hardcoded. Every new organization requires a code deploy to whitelist their domain.

**Solution**: Store allowed origins in the `org_api_keys` table (new `allowed_origins TEXT[]` column) and validate dynamically at runtime. The edge function would look up the API key first, then check if the request origin matches that key's allowed origins.

### 2. Rate Limiting

**Problem**: No rate limiting exists. A misconfigured client-side script could hammer the API.

**Solution**: Add a simple in-memory or Redis-based rate limiter (e.g., 100 requests/minute per API key). For a lightweight approach, track request counts in a `api_request_logs` table and check against limits.

### 3. Embeddable JavaScript SDK / Widget

**Problem**: Each organization must build their own frontend integration from scratch.

**Solution**: Provide a lightweight JS SDK that organizations drop into their site:

```html
<script src="https://applyai.jobs/sdk.js" data-api-key="org_xxx"></script>
<div id="applyai-dashboard"></div>
```

The SDK would handle API calls, render pre-built dashboard components (stats cards, job tables, application lists), and support theming to match the organization's brand.

### 4. Webhook / Real-Time Push Notifications

**Problem**: The current API is pull-only. Organizations must poll for new data.

**Solution**: Add webhook support so organizations receive push notifications when new applications arrive, statuses change, etc. You already have a `webhook_configurations` table and `trigger_outbound_webhook` function — extend this pattern to the organization API.

### 5. Documentation & Onboarding

**Problem**: No self-service documentation for organizations to integrate.

**Solution**: Create an API docs page (e.g., `/api-docs`) with:
- Authentication instructions (how to use `x-api-key`)
- Endpoint reference with request/response examples
- Code snippets (JavaScript fetch, cURL, React)
- A test console to try endpoints live

---

## Recommended Implementation Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Dynamic CORS origins per API key | Small — DB migration + edge function update |
| 2 | Embeddable JS SDK with dashboard widgets | Medium — new public JS file + styled components |
| 3 | API documentation page | Small — new route with static content |
| 4 | Rate limiting | Small — edge function logic |
| 5 | Webhook push notifications | Medium — extend existing webhook infra |

---

## Technical Approach for Priority 1 (Dynamic CORS)

- Add `allowed_origins TEXT[]` column to `org_api_keys`
- Update `APIKeyManager` UI to let admins configure their domains
- Modify the edge function to validate origin against the key's allowed origins instead of the hardcoded list
- Fallback: if no origins configured, deny cross-origin requests (secure by default)

This single change would make the existing API self-service for any organization without requiring code deploys.

---

## What Would You Like to Build?

The existing `organization-api` is a strong starting point. The biggest bang-for-buck improvements are **dynamic CORS** (so any org can self-onboard) and an **embeddable SDK** (so orgs don't need to build their own UI). Let me know which direction you'd like to go, and I'll create a detailed implementation plan.

