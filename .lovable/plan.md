
# Fix: CORS Configuration for Embed Widget

## Problem
The `resolve-embed-token` edge function is blocking requests from `hatesairecruiting.com` because the current CORS configuration only allows specific whitelisted origins. When the widget tries to fetch the token from a third-party site, the browser blocks the request.

## Root Cause
The function uses `getCorsHeaders(origin)` which checks against a fixed list of allowed domains. Since the widget is designed to work on **any external website**, this approach is too restrictive.

## Solution
Update the `resolve-embed-token` edge function to use permissive CORS headers (`Access-Control-Allow-Origin: *`) since:

1. This endpoint is **designed for public embedding** on third-party sites
2. It only returns non-sensitive data (embed URL, client name, job title)
3. Domain-level security is already handled via the `allowed_domains` column in the token itself
4. No authentication or credentials are required for this endpoint

## Changes Required

### File: `supabase/functions/resolve-embed-token/index.ts`

Replace the dynamic CORS header lookup with a static permissive header specifically for this public endpoint:

```text
Before:
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

After:
  // This endpoint must allow ANY origin since it's designed for 
  // embedding on third-party websites. Domain security is handled 
  // via the allowed_domains column in the token itself.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
```

## Security Considerations

This change is safe because:

| Concern | Mitigation |
|---------|------------|
| Unauthorized domains | The `allowed_domains` array in each token validates the `Referer` header |
| Token abuse | Tokens can be deactivated instantly via `is_active` flag |
| Expiration | Tokens support `expires_at` for time-limited access |
| Analytics | Impressions are tracked to detect abuse patterns |
| Data exposure | Only returns public job metadata, no sensitive information |

## After Deployment

Once deployed, the widget on `hatesairecruiting.com` will:
1. Successfully call the token resolution endpoint
2. Receive the embed URL and metadata
3. Inject the iframe with the application form

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/resolve-embed-token/index.ts` | Replace `getCorsHeaders(origin)` with permissive CORS headers |
