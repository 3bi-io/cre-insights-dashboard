

# Embeddable Apply Page (Light Mode Only)

## Overview

Create a standalone embeddable version of the `/apply` page that:
1. Forces light mode regardless of system/user theme preferences
2. Is optimized for iframe embedding on external websites
3. Removes navigation elements that don't make sense in an embedded context
4. Includes proper iframe security headers and sizing behaviors

## Current Architecture

The existing `/apply` page uses:
- `useApplyContext` hook to fetch job/org context from URL params
- `ApplicationHeader` for branding and job details
- `ApplicationForm` with 4-step wizard (Personal, CDL, Background, Consent)
- Theme system via CSS variables (`:root` for light, `.dark` for dark mode)
- Submits to `submit-application` edge function
- Redirects to `/thank-you` on success

## Implementation Plan

### 1. Create Embed Apply Page

**File**: `src/pages/EmbedApply.tsx`

A dedicated page component that:
- Wraps the existing form components
- Forces light theme by adding `light` class to document and setting CSS variables
- Removes back-to-home navigation (not relevant in iframe)
- Uses `postMessage` to communicate submission success to parent window
- Has minimal padding optimized for iframe display
- Includes optional "Powered by ATS.me" footer

Key changes from original:
- No `<Link to="/">` navigation
- Inline light theme enforcement via `useEffect`
- Post-submission behavior: send message to parent OR show inline success

### 2. Create Embed Thank You Component

**File**: `src/components/apply/EmbedThankYou.tsx`

An inline success state (instead of page redirect) that:
- Shows success message within the same iframe
- Sends `postMessage` to parent window with submission result
- Optional: auto-close or redirect behavior configurable via URL params

### 3. Update Routing

**File**: `src/components/routing/AppRoutes.tsx`

Add new route:
```
/embed/apply → EmbedApply (no layout wrapper)
```

### 4. URL Parameters for Customization

The embed page will support additional URL params:
- `?job_listing_id=xxx` - Existing job context
- `?org=xxx` - Organization slug
- `?hide_branding=true` - Hide "Powered by ATS.me"
- `?success_redirect=https://...` - Redirect parent on success
- `?success_message=postMessage` - Use postMessage on success

### 5. Parent Window Integration

Provide JavaScript snippet for embedding:

```html
<iframe 
  src="https://ats.me/embed/apply?org=acme-trucking&job_listing_id=123"
  style="width: 100%; min-height: 600px; border: none;"
  allow="clipboard-write"
></iframe>

<script>
window.addEventListener('message', function(e) {
  if (e.origin !== 'https://ats.me') return;
  if (e.data.type === 'application_submitted') {
    console.log('Application submitted:', e.data.applicationId);
    // Handle success (e.g., redirect, show modal, track conversion)
  }
  if (e.data.type === 'resize') {
    document.querySelector('iframe').style.height = e.data.height + 'px';
  }
});
</script>
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/EmbedApply.tsx` | Create | Embeddable apply page with forced light mode |
| `src/components/apply/EmbedThankYou.tsx` | Create | Inline success state for embed |
| `src/hooks/useEmbedMode.ts` | Create | Hook for iframe detection and postMessage |
| `src/components/routing/AppRoutes.tsx` | Modify | Add `/embed/apply` route |

## Technical Details

### Light Mode Enforcement

```typescript
// In EmbedApply.tsx
useEffect(() => {
  // Force light mode on document
  const root = document.documentElement;
  root.classList.remove('dark');
  root.classList.add('light');
  
  // Cleanup on unmount (restore original theme)
  return () => {
    // Only restore if we're still on embed page
  };
}, []);
```

### PostMessage Communication

```typescript
// On successful submission
const notifyParent = (data: { type: string; applicationId?: string }) => {
  if (window.parent !== window) {
    window.parent.postMessage(data, '*');
  }
};

// Auto-resize for dynamic content
useEffect(() => {
  const sendHeight = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'resize',
        height: document.body.scrollHeight
      }, '*');
    }
  };
  const observer = new ResizeObserver(sendHeight);
  observer.observe(document.body);
  return () => observer.disconnect();
}, []);
```

### Modified Form Hook

Create a wrapper around `useApplicationForm` that:
- Overrides the success handler to use postMessage instead of navigate
- Stores success state locally for inline thank-you display

## Security Considerations

1. **CORS**: The edge function already accepts cross-origin requests
2. **X-Frame-Options**: Ensure the embed route is allowed to be iframed (Lovable's default should allow this)
3. **Origin Validation**: When using postMessage, validate the parent origin if needed
4. **Input Sanitization**: Existing form validation applies

## User Experience Flow

```
External Website                     Embed Iframe
      |                                    |
      |  <-- User visits page              |
      |       with iframe embed            |
      |                                    |
      |                           [Apply Form Step 1]
      |                                    |
      |                           [Apply Form Step 2]
      |                                    |
      |                           [Apply Form Step 3]
      |                                    |
      |                           [Apply Form Step 4]
      |                                    |
      |                           [Submit Button]
      |                                    |
      |                           [Inline Success]
      |                                    |
      |  postMessage({type: 'submitted'})  |
      |  <---------------------------------|
      |                                    |
[Handle success event]                     |
```

## Expected Outcome

After implementation:
- External websites can embed `<iframe src="https://ats.me/embed/apply?org=acme">` 
- The form displays in consistent light mode regardless of system theme
- Form submissions work identically to the main `/apply` page
- Parent windows receive success notifications via postMessage
- The iframe auto-resizes based on content height

