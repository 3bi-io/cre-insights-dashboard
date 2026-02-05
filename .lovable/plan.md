
# Plan: JavaScript Embed Widget for Hidden URL Application Forms

## Overview
Create a JavaScript widget that clients can embed on their websites using a simple `<script>` tag with a data attribute. The widget dynamically renders the application form without exposing the actual source URL (`ats.me/embed/apply?job_id=...`) in the HTML source.

## Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                     CLIENT WEBSITE                                │
│                                                                   │
│   <div id="ats-apply"></div>                                      │
│   <script src="https://ats.me/widget.js"                          │
│           data-token="abc123xyz"                                  │
│           data-container="ats-apply"></script>                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                     WIDGET.JS (Loader)                            │
│   1. Reads data-token from script tag                             │
│   2. Resolves container element                                   │
│   3. Creates iframe with resolved URL                             │
│   4. Sets up postMessage communication                            │
│   5. Handles auto-resize from form                                │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: resolve-embed-token                   │
│   1. Receives encrypted token                                     │
│   2. Decrypts → job_listing_id + UTM params                       │
│   3. Returns { redirectUrl: '/embed/apply?job_id=...' }           │
│   4. Logs widget impression for analytics                         │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                     IFRAME (Hidden URL)                           │
│   src dynamically set by JavaScript                               │
│   Not visible in page source                                      │
│   Uses /embed/apply with all params                               │
└───────────────────────────────────────────────────────────────────┘
```

## Solution Components

### 1. Database: Embed Tokens Table
**File:** Database migration (via Supabase dashboard)

Create a new table `embed_tokens` to store encrypted tokens that map to job configurations:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| token | varchar(32) | Unique encrypted token (URL-safe) |
| job_listing_id | uuid | References job_listings |
| organization_id | uuid | References organizations |
| utm_source | varchar | Marketing attribution |
| utm_medium | varchar | Marketing attribution |
| utm_campaign | varchar | Marketing attribution |
| allowed_domains | text[] | Domain whitelist for security |
| impression_count | integer | Analytics tracking |
| is_active | boolean | Enable/disable token |
| created_at | timestamp | Creation time |
| created_by | uuid | Admin user who created |

### 2. Edge Function: Resolve Token
**File:** `supabase/functions/resolve-embed-token/index.ts`

Server-side token resolution that:
- Accepts GET request with `?token=abc123`
- Validates token exists and is active
- Optionally validates referrer domain against `allowed_domains`
- Increments `impression_count` for analytics
- Returns JSON with the resolved embed URL

### 3. JavaScript Widget Loader
**File:** `public/widget.js`

Lightweight (~3KB) JavaScript that:
- Self-initializes when loaded
- Reads configuration from `data-*` attributes on script tag
- Calls the token resolution endpoint
- Creates an iframe dynamically (URL not in source)
- Handles postMessage communication for resize and events
- Provides callback hooks for form submission events

### 4. Admin UI: Token Management
**Files:** 
- `src/features/jobs/components/EmbedTokenGenerator.tsx`
- Updates to job detail page

Interface for generating embed tokens with:
- Domain whitelist configuration
- UTM parameter customization
- Copy-to-clipboard for script snippet
- Token analytics (impressions, submissions)

### 5. Hook: Embed Token Operations
**File:** `src/hooks/useEmbedTokens.ts`

React hook for:
- Creating new embed tokens
- Listing tokens for a job
- Deactivating tokens
- Analytics retrieval

## Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/resolve-embed-token/index.ts` | Token resolution edge function |
| `public/widget.js` | Client-side widget loader |
| `src/hooks/useEmbedTokens.ts` | Token management hook |
| `src/features/jobs/components/EmbedTokenGenerator.tsx` | Admin UI for token creation |
| `src/features/jobs/components/EmbedCodeSnippet.tsx` | Copyable embed code display |

## Files to Modify

| File | Change |
|------|--------|
| Job detail page | Add "Get Embed Code" button/section |
| `src/utils/exportJobUrls.ts` | Add embed widget URL column to CSV |

## Widget Usage Example

**On client website:**
```html
<!-- Container for the form -->
<div id="driver-application"></div>

<!-- Widget script (URL visible, but token hides job_id) -->
<script 
  src="https://ats.me/widget.js" 
  data-token="k7mNpQ2xR9wL"
  data-container="driver-application"
  async
></script>
```

**What the client sees in View Source:**
```html
<div id="driver-application"></div>
<script src="https://ats.me/widget.js" data-token="k7mNpQ2xR9wL" ...></script>
```

**What actually happens (invisible to View Source):**
1. widget.js loads and reads `data-token="k7mNpQ2xR9wL"`
2. Calls `https://ats.me/functions/v1/resolve-embed-token?token=k7mNpQ2xR9wL`
3. Receives `{ url: "/embed/apply?job_id=965484d2-...&utm_source=widget" }`
4. Creates iframe with that URL dynamically via JavaScript
5. Injects iframe into `#driver-application` container

## Security Considerations

1. **Domain Whitelisting**: Optional `allowed_domains` array validates the `Referer` header
2. **Token Expiration**: Optional `expires_at` column for time-limited tokens
3. **Rate Limiting**: Apply rate limits on token resolution endpoint
4. **Analytics Tracking**: Log impressions to detect abuse patterns
5. **Token Revocation**: Admin can deactivate tokens instantly

## Widget Events (postMessage API)

The widget will emit events to the parent page:
- `ats_widget_ready` - Widget initialized
- `ats_widget_resize` - Height changed (for responsive containers)
- `ats_application_submitted` - Form submitted successfully
- `ats_application_error` - Submission failed

## Technical Implementation Details

### Token Generation Algorithm
```
token = base62_encode(random_bytes(16))  // 22-char URL-safe string
```

### Widget.js Core Logic
```javascript
(function() {
  const script = document.currentScript;
  const token = script.dataset.token;
  const containerId = script.dataset.container || 'ats-apply-widget';
  
  // Fetch resolved URL (job_id hidden)
  fetch(`https://ats.me/functions/v1/resolve-embed-token?token=${token}`)
    .then(r => r.json())
    .then(data => {
      if (!data.url) throw new Error('Invalid token');
      
      // Create iframe dynamically
      const iframe = document.createElement('iframe');
      iframe.src = `https://ats.me${data.url}`;
      iframe.style.cssText = 'width:100%;border:none;';
      
      // Auto-resize handler
      window.addEventListener('message', (e) => {
        if (e.data.type === 'resize') {
          iframe.style.height = e.data.height + 'px';
        }
      });
      
      document.getElementById(containerId).appendChild(iframe);
    });
})();
```

### Edge Function Response Format
```json
{
  "success": true,
  "url": "/embed/apply?job_id=965484d2-...&utm_source=widget&utm_medium=embed",
  "clientName": "Danny Herman Trucking",
  "jobTitle": "OTR Driver - Kansas City"
}
```

## Migration Path

1. Create database table for embed tokens
2. Build edge function for token resolution
3. Create public/widget.js loader
4. Add admin UI for token generation
5. Update CSV export to include widget URLs
