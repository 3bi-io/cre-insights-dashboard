
# Fix Missing Greenland in Region Blocked Page

## Issue Identified

The "Access Restricted" page has a **hardcoded description** that doesn't include Greenland, even though:
- The backend `geo-blocking.ts` was updated to include Greenland in `getAllowedRegionsDescription()`
- The `allowedRegions` field is returned from the geo-check API
- The context properly stores and exposes `allowedRegions`

### Current Code (RegionBlocked.tsx, lines 71-72)
```tsx
<p className="text-xs mt-1">
  Including the United States, Canada, Mexico, Central America, 
  the Caribbean, and all South American countries.
</p>
```

This **hardcoded text** overrides the dynamic `allowedRegions` value from the context.

---

## Solution

Update the description text in `RegionBlocked.tsx` to include Greenland, matching the updated backend description.

### File to Modify

| File | Change |
|------|--------|
| `src/pages/RegionBlocked.tsx` | Update hardcoded description to include Greenland |

### Code Change

**Lines 71-73** - Update the description text:

```tsx
<p className="text-xs mt-1">
  Including Greenland, Canada, the United States, Mexico, Central America, 
  the Caribbean, and all South American countries.
</p>
```

---

## Why Not Use Dynamic `allowedRegions`?

The `allowedRegions` context value contains the full description string ("North America (including Greenland, Canada, USA...)") which is already displayed on **line 68**. The secondary text on lines 71-72 provides additional detail in a more readable format. Keeping both texts consistent ensures a cohesive user experience.

---

## Verification

After the fix, the page will display:
- **Primary**: "North America (including Greenland, Canada, USA, Mexico, Central America, and the Caribbean) and South America"
- **Secondary**: "Including Greenland, Canada, the United States, Mexico, Central America, the Caribbean, and all South American countries."
