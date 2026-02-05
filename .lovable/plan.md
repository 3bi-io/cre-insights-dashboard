

# Update Resources & Documentation Navigation

## Summary
The Resources page contains broken links pointing to the removed `/demo` route, and the overall documentation experience can be improved by updating links to point to more relevant destinations.

## Issues Identified

| Location | Problem |
|----------|---------|
| `ResourcesPage.tsx` | 4 links pointing to `/demo` (removed route) |
| `internalLinks.ts` | Contains `/voice-demo` reference that redirects to removed `/demo` |
| Resources page content | Links could be more actionable and lead to better destinations |

## Proposed Changes

### 1. Fix ResourcesPage.tsx - Update Broken Links

**Getting Started section:**
- "Creating Your First Job" - Change `/demo` to `/jobs` (shows real job examples)
- "Account Setup & Configuration" - Change `/demo` to `/contact` (onboarding assistance)

**Technical Documentation section:**
- "Analytics Guide" - Change `/demo` to `/features` (shows analytics features)
- "Admin Configuration" - Change `/demo` to `/contact` (get help setting up)

### 2. Update internalLinks.ts

Remove the `/voice-demo` entry from `INTERNAL_LINKS` since it now redirects to a removed page. Update the description for `/resources` to be more compelling.

### 3. Enhance Resources Page Content

Update descriptions to be clearer about what users will find:

| Item | Current Link | New Link | Rationale |
|------|--------------|----------|-----------|
| Creating Your First Job | `/demo` | `/jobs` | See real job listings as examples |
| Account Setup | `/demo` | `/contact` | Contact team for onboarding help |
| Analytics Guide | `/demo` | `/features#core-features` | Links to analytics feature info |
| Admin Configuration | `/demo` | `/contact` | Get admin setup assistance |

### 4. Consider API/Webhook Documentation Links

Currently "API Documentation" and "Webhook Integration" link to `/contact`. This is appropriate since these require customer onboarding, but the badge "Contact Us" makes this clear.

---

## Technical Details

### File: `src/pages/public/ResourcesPage.tsx`

**Lines 47-67 (gettingStarted array):**
```typescript
// Before
{ link: '/demo', step: 2 }  // Creating Your First Job
{ link: '/demo', step: 3 }  // Account Setup

// After
{ link: '/jobs', step: 2 }   // See real job examples
{ link: '/contact', step: 3 } // Get onboarding help
```

**Lines 86-96 (documentation array):**
```typescript
// Before
{ link: '/demo' }  // Analytics Guide
{ link: '/demo' }  // Admin Configuration

// After
{ link: '/features', badge: undefined }  // Analytics Guide - features page has analytics info
{ link: '/contact', badge: 'Contact Us' } // Admin Configuration - get help
```

### File: `src/utils/internalLinks.ts`

**Lines 47-53:** Remove or update the `/voice-demo` entry:
```typescript
// Before
{
  path: '/voice-demo',
  label: 'Voice Agent Demo',
  description: 'Listen to AI voice agent call recordings',
  category: 'primary',
  priority: 0.8,
},

// After - Remove this entry entirely
```

---

## UX Improvements

1. **Consistent CTAs** - All "Contact Us" items now clearly indicate they lead to contact form
2. **Actionable links** - Resources lead to real, useful destinations
3. **No dead ends** - All links point to active routes
4. **Better flow** - Users can explore features or get help seamlessly

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/public/ResourcesPage.tsx` | Update 4 links from `/demo` to relevant pages |
| `src/utils/internalLinks.ts` | Remove `/voice-demo` entry from `INTERNAL_LINKS` |

