
# Fix Detailed Apply Form Issues

## Overview

The `/apply/detailed` form has two issues that need to be addressed for proper functionality:

1. **Broken navigation after submission** - navigates to non-existent route
2. **Missing form wrapper element** - causes E2E test failure

---

## Issue 1: Fix Success Navigation Route

**Current Problem**

After successful submission, users are redirected to `/apply/success` which doesn't exist (results in 404 page).

**File**: `src/hooks/useDetailedApplicationForm.ts`

**Change**: Update line 431 from `/apply/success` to `/thank-you`

```typescript
// Before
navigate('/apply/success');

// After
navigate('/thank-you');
```

---

## Issue 2: Add Form Wrapper Element

**Current Problem**

The `DetailedApplicationForm.tsx` doesn't have a `<form>` element, which:
- Breaks the E2E test that expects `getByRole('form')`
- Misses semantic HTML best practices

**File**: `src/components/apply/detailed/DetailedApplicationForm.tsx`

**Change**: Wrap the form content in a `<form>` element with proper attributes

```tsx
// Inside the main content area, wrap the step sections and navigation:
<form 
  onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
  className="min-h-[400px]"
  noValidate
>
  {STEP_SECTIONS.map(...)}
  <StepNavigation ... />
</form>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useDetailedApplicationForm.ts` | Change navigation target from `/apply/success` to `/thank-you` |
| `src/components/apply/detailed/DetailedApplicationForm.tsx` | Add `<form>` wrapper around step sections and navigation |

---

## Technical Notes

- The `<form>` wrapper uses `noValidate` to allow custom validation
- `onSubmit` handler calls `handleSubmit()` which already handles all validation
- The form wrapper maintains the existing layout and styling
- Both changes ensure parity with the quick apply form behavior
