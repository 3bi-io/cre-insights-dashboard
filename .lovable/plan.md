
## Logo Size Enhancement for /apply Pages

### Overview

This refactor increases logo sizes across all apply pages for stronger brand presence following best practices for candidate-facing pages. The current implementation uses a small `h-8 w-8` logo that gets lost next to the job title. We'll create a hero-style branding treatment with prominent logos.

---

### Current State Analysis

| Page | Component | Current Logo Size | Issue |
|------|-----------|-------------------|-------|
| `/apply` | `ApplicationHeader` | `h-8 w-8` (32px) | Too small, inline with metadata |
| `/apply/detailed` | `ApplicationHeader` | `h-8 w-8` (32px) | Same component, same issue |
| `/embed/apply` | `ApplicationHeader` | `h-8 w-8` (32px) | Same component, same issue |
| `/thank-you` | None | No logo | Missing brand reinforcement |
| `/embed/apply` (success) | `EmbedThankYou` | None | Missing brand reinforcement |

**Best Practice**: Logos on application landing pages should be 64-96px to establish trust and brand recognition immediately.

---

### Design Solution

#### New Layout Structure

```text
BEFORE (Current):
┌────────────────────────────────────────────┐
│           Driver Application               │
│    [tiny logo] Company Name • Location     │
└────────────────────────────────────────────┘

AFTER (Proposed):
┌────────────────────────────────────────────┐
│         ┌────────────┐                     │
│         │            │                     │
│         │   LOGO     │  (80px centered)    │
│         │            │                     │
│         └────────────┘                     │
│                                            │
│           Driver Application               │
│         Company Name • Location            │
└────────────────────────────────────────────┘
```

---

### Implementation Details

#### 1. Update LogoAvatar Component Sizes

Add a new "2xl" size tier for hero-level logo display:

**File:** `src/components/ui/logo-avatar.tsx`

| Size | Current | New |
|------|---------|-----|
| sm | h-10 w-10 (40px) | unchanged |
| md | h-12 w-12 (48px) | unchanged |
| lg | h-14 w-14 (56px) | unchanged |
| xl | h-16 w-16 (64px) | unchanged |
| **2xl** | N/A | **h-20 w-20 (80px)** |
| **3xl** | N/A | **h-24 w-24 (96px)** |

Update icon fallback sizes accordingly.

---

#### 2. Refactor ApplicationHeader Component

**File:** `src/components/apply/ApplicationHeader.tsx`

Changes:
- Move logo above the title for hero positioning
- Increase logo size to "2xl" (80px)
- Center the logo with proper spacing
- Keep metadata (location, source) below title
- Add subtle shadow and better visual hierarchy

New structure:
```tsx
<header className="text-center mb-8">
  {/* Hero Logo - Centered above title */}
  {clientLogoUrl && (
    <div className="flex justify-center mb-4">
      <LogoAvatar size="2xl" className="shadow-md">
        <LogoAvatarImage src={clientLogoUrl} alt={`${clientName} logo`} />
      </LogoAvatar>
    </div>
  )}
  
  {/* Job Title */}
  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{displayTitle}</h1>
  
  {/* Company & Metadata */}
  <div className="flex items-center justify-center gap-4 text-muted-foreground">
    {clientName && <span>{clientName}</span>}
    {location && <MetadataBadge icon={MapPin}>{location}</MetadataBadge>}
  </div>
</header>
```

---

#### 3. Add Logo to Thank You Pages

**File:** `src/pages/ThankYou.tsx`

- Accept optional `logoUrl` in navigation state
- Display logo above success icon when available
- Uses "xl" size (64px) for secondary prominence

**File:** `src/components/apply/EmbedThankYou.tsx`

- Add `clientLogoUrl` prop
- Display logo in success card header
- Pass logo from EmbedApply submission result

---

#### 4. Update Page Components to Pass Logo

**Files to update:**
- `src/pages/Apply.tsx` - Already passes `clientLogoUrl` ✓
- `src/pages/EmbedApply.tsx` - Add `clientLogoUrl` to context and submission result
- `src/components/apply/detailed/DetailedApplicationForm.tsx` - Already passes `clientLogoUrl` ✓

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/logo-avatar.tsx` | Add 2xl/3xl size tiers |
| `src/components/apply/ApplicationHeader.tsx` | Hero logo layout, larger size |
| `src/pages/ThankYou.tsx` | Accept and display logo from state |
| `src/components/apply/EmbedThankYou.tsx` | Add logo prop and display |
| `src/pages/EmbedApply.tsx` | Pass clientLogoUrl through submission flow |
| `src/hooks/useApplyContext.ts` | Verify clientLogoUrl is exposed (may already be) |

---

### Visual Comparison

**Mobile (375px)**
- Logo: 64px (reduced from 80px for mobile)
- Title: 24px
- Metadata: 14px

**Desktop (768px+)**
- Logo: 80px
- Title: 30px  
- Metadata: 14px

---

### Technical Notes

- The `LogoAvatar` component already uses `rounded-2xl` and `object-contain` per design system
- Shadow class `shadow-md` adds depth without being heavy
- The `p-2` internal padding in `LogoAvatarImage` ensures logos don't touch edges
- Fallback icon (Building2) scales with the new 2xl/3xl sizes
