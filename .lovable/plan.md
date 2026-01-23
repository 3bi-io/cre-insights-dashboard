
# Fix CORS Configuration for Lovable Preview Environments

## Problem Identified

The browser is blocked from accessing the app due to a **CORS mismatch**:

- **Request origin**: `https://cf22d483-762d-45c7-a42c-85b40ce9290a.lovableproject.com`
- **Returned CORS header**: `Access-Control-Allow-Origin: https://ats.me`

The `geo-check` edge function has a bypass that detects `lovableproject.com`, but the **CORS headers** use `cors-config.ts` which only checks for `lovable.app` and `lovable.dev` - **not `lovableproject.com`**.

```
Browser Console Error:
Access to fetch at '.../geo-check' from origin '...lovableproject.com' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header 
has a value 'https://ats.me' that is not equal to the supplied origin.
```

---

## Solution

Update the shared `isLovablePreview()` function in `cors-config.ts` to also include `lovableproject.com`:

### File to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/cors-config.ts` | Add `lovableproject.com` to preview detection |

### Code Change

**Lines 33-35** - Update `isLovablePreview()`:

```typescript
export function isLovablePreview(origin: string): boolean {
  return origin.includes('lovable.app') || 
         origin.includes('lovable.dev') || 
         origin.includes('lovableproject.com');
}
```

---

## Why This Fixes It

1. The `getCorsHeaders()` function calls `isOriginAllowed()`
2. `isOriginAllowed()` calls `isLovablePreview()` to check if the origin is a Lovable preview
3. When `isLovablePreview()` returns `true`, the CORS header will use the **actual request origin** instead of falling back to `https://ats.me`
4. The browser will then accept the response since the CORS header matches the request origin

---

## Impact

- **All edge functions** using `getCorsHeaders()` will automatically allow `lovableproject.com` origins
- Preview environments and the AI browser tool will have full access
- No security risk since `lovableproject.com` is an official Lovable domain
- Production geo-blocking still enforced for non-Americas visitors on production domains
