

# Fix: Outbound Email Light Mode Visibility

## Problem
The "Complete Your Full Application" button in the application received email uses `background: linear-gradient(...)` without a solid `background-color` fallback. Many email clients strip CSS gradients, leaving white text (`#ffffff`) on a transparent/white background -- making the button text invisible in light mode.

The screenshot confirms this: the button area is visible but the text is unreadable.

## Changes

### File: `supabase/functions/send-application-email/index.ts`

**Line 116** — Update the CTA button inline styles:
- Add `background-color: #667eea;` as a solid fallback before the gradient
- Add `color: #ffffff !important;` to prevent email client overrides on text color
- Apply the same pattern to any other gradient-based buttons/links in the file (interview join button on line 182)

### Redeploy
- Deploy the updated `send-application-email` Edge Function so the fix takes effect for all future emails.

## Technical Details
- Email clients like Apple Mail, Gmail, and Outlook selectively strip `linear-gradient`. Without a `background-color` fallback, the button renders as transparent, making white text invisible.
- Adding `!important` on `color` prevents dark-mode or light-mode email client overrides from changing button text color.

