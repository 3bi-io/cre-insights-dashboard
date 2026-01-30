
# Add Side Margins for Mobile Device Eye Frames

## Overview

Add additional horizontal padding/margins to the `/embed/apply` page to prevent content from being cut off by curved edges or notch areas on modern mobile devices when embedded in external websites.

## Current State

The embed page currently uses:
- **Main container**: `px-3 sm:px-4` (12px mobile, 16px desktop)
- **Thank you page**: `px-4` (16px)

This minimal padding can cause content to be partially obscured by device "eye frames" (curved screen edges, notches, or rounded corners) common on modern smartphones.

## Proposed Changes

Increase horizontal padding on mobile to provide adequate safe area margins:

| Element | Current | New |
|---------|---------|-----|
| Main form container | `px-3 sm:px-4` | `px-6 sm:px-4` |
| Thank you container | `min-h-screen` | `min-h-screen px-6 sm:px-4` |

The change uses `px-6` (24px) on mobile for comfortable eye frame clearance while maintaining the current `px-4` (16px) on larger screens where this isn't a concern.

## Technical Details

### File: `src/pages/EmbedApply.tsx`

**Change 1** - Update the main form container (line 85):
```tsx
// Before
<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">

// After  
<div className="container mx-auto px-6 sm:px-4 py-4 sm:py-6">
```

**Change 2** - Update the thank you page container (line 73):
```tsx
// Before
<div className="min-h-screen bg-background">

// After
<div className="min-h-screen bg-background px-6 sm:px-4">
```

## Impact

- Provides 24px (1.5rem) of horizontal safe area on mobile devices
- Ensures form inputs, buttons, and text remain fully visible within curved screen edges
- Maintains current desktop appearance
- No functional changes to form behavior or parent window communication
