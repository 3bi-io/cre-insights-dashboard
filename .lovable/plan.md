

## Problem: Nylas OAuth Redirect URI Mismatch

The error is clear:

```
For Application '384b8927-453f-414b-ba44-c032aee02a8d' given
RedirectURI 'https://applyai.jobs/**' is not allowed
```

The `NYLAS_REDIRECT_URI` secret is currently set to `https://applyai.jobs/**` (with a wildcard), but Nylas requires an **exact** redirect URI — no wildcards.

### What Needs to Happen

**No code changes required.** This is a configuration fix in two places:

#### 1. Update the `NYLAS_REDIRECT_URI` Supabase secret
Change it from `https://applyai.jobs/**` to the exact callback URL:
```
https://applyai.jobs/calendar/callback
```

#### 2. Register the redirect URI in the Nylas Dashboard
Go to your [Nylas Dashboard](https://dashboard.nylas.com) → Application `384b8927-...` → **Callback URIs** and add:
```
https://applyai.jobs/calendar/callback
```

Make sure it matches exactly — no trailing slash, no wildcard.

### Implementation
I will update the `NYLAS_REDIRECT_URI` secret. You will need to manually add the URI in the Nylas dashboard.

