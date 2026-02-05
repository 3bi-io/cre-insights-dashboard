

## Increase Logo Size on Job Details Page

### Overview

Update the job details page (`/jobs/:id`) to use the hero-style `2xl` logo size (80px), matching the apply pages for consistent branding across all candidate-facing pages.

---

### Current vs. Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Size | `lg` (56px) with `lg:h-16 lg:w-16` (64px) override | `2xl` (80px) |
| Fallback icon | `lg` | `xl` (proportional) |
| Layout | Inline with title | Inline with title (larger) |

---

### Implementation

**File:** `src/pages/public/JobDetailsPage.tsx`

**Change (line 204-213):**

```tsx
// BEFORE
<LogoAvatar size="lg" className="lg:h-16 lg:w-16">
  {job.clients?.logo_url ? (
    <LogoAvatarImage ... />
  ) : (
    <LogoAvatarFallback iconSize="lg" />
  )}
</LogoAvatar>

// AFTER
<LogoAvatar size="2xl">
  {job.clients?.logo_url ? (
    <LogoAvatarImage ... />
  ) : (
    <LogoAvatarFallback iconSize="xl" />
  )}
</LogoAvatar>
```

**Changes:**
- Update `size="lg"` to `size="2xl"` (80px, matching apply pages)
- Remove the `className="lg:h-16 lg:w-16"` override (no longer needed)
- Update fallback `iconSize` from `lg` to `xl` for proper proportions

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/public/JobDetailsPage.tsx` | Update LogoAvatar size from `lg` to `2xl` |

