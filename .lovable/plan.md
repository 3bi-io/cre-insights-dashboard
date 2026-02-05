
# Fix CORS: Use Supabase Functions URL in Widget

## Problem
The widget calls `https://ats.me/functions/v1/resolve-embed-token` which requires custom domain proxy configuration. The custom domain isn't properly forwarding requests to Supabase edge functions, causing CORS errors.

## Solution
Update the widget to call Supabase edge functions directly instead of through the custom domain, while keeping the iframe URL on `ats.me` for branding.

## Technical Changes

### File: `public/widget.js`

Add a separate API base URL for edge function calls:

```text
Line 33-34 changes:

Before:
var baseUrl = script.getAttribute('data-base-url') || 'https://ats.me';
var minHeight = parseInt(script.getAttribute('data-min-height') || '600', 10);

After:
var baseUrl = script.getAttribute('data-base-url') || 'https://ats.me';
var apiUrl = script.getAttribute('data-api-url') || 'https://auwhcdpppldjlcaxzsme.supabase.co';
var minHeight = parseInt(script.getAttribute('data-min-height') || '600', 10);
```

```text
Line 63 changes:

Before:
var resolveUrl = baseUrl + '/functions/v1/resolve-embed-token?token=' + encodeURIComponent(token);

After:
var resolveUrl = apiUrl + '/functions/v1/resolve-embed-token?token=' + encodeURIComponent(token);
```

## How It Works

| Request Type | URL | Purpose |
|--------------|-----|---------|
| Token Resolution API | `auwhcdpppldjlcaxzsme.supabase.co/functions/v1/...` | Edge function with proper CORS |
| Iframe Embed | `ats.me/embed/apply?...` | Branded application form UI |

## Benefits

1. **Immediate fix** - No custom domain proxy configuration needed
2. **Reliable CORS** - Supabase handles CORS correctly
3. **Maintains branding** - The visible iframe still shows `ats.me` URLs
4. **Backwards compatible** - Existing embeds continue working

## Optional: Custom API URL Override

The new `data-api-url` attribute allows clients to override the API endpoint if needed:
```html
<script 
  src="https://ats.me/widget.js" 
  data-token="abc123"
  data-api-url="https://custom-proxy.example.com"
></script>
```

## Files to Modify

| File | Change |
|------|--------|
| `public/widget.js` | Add `apiUrl` variable, use it for resolve-embed-token call |
