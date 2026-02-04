
# Premium Square Logo Design with App-Icon Styling

## Overview

Transform all company/client logo displays from circular avatars to a premium **app-icon style** with larger rounded corners (`rounded-2xl`), dark/muted backgrounds, and proper padding. This creates a modern, premium aesthetic matching the reference design.

## Reference Design Analysis

The reference image shows:
- **Large rounded corners** - approximately `rounded-2xl` (16px radius)
- **Dark background** - solid dark container
- **Centered logo** - with adequate padding
- **Square aspect ratio** - not circular
- **Premium feel** - modern app-icon aesthetic

## Current State

| Component | Current Styling | Issue |
|-----------|-----------------|-------|
| `Avatar` (base) | `rounded-full` | Circular - cuts off rectangular logos |
| `PublicJobCard.tsx` | `Avatar` with circular styling | Logos appear cropped |
| `JobDetailsPage.tsx` | `Avatar` with circular styling | Logos appear cropped |
| `ClientLogoUpload.tsx` | `Avatar` preview - circular | Upload preview misleading |
| `OrganizationManagement.tsx` | `rounded` (small) | Inconsistent with new design |
| `ApplicationHeader.tsx` | No logo support yet | Needs to be added |

---

## Implementation Plan

### Step 1: Create Premium Logo Avatar Component

**File**: `src/components/ui/logo-avatar.tsx` (NEW)

Create a dedicated component for brand/company logos with app-icon styling:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"

interface LogoAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12", 
  lg: "h-14 w-14",
  xl: "h-16 w-16"
}

const LogoAvatar = React.forwardRef<HTMLDivElement, LogoAvatarProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/80 border border-border/50",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
)
LogoAvatar.displayName = "LogoAvatar"

const LogoAvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, ...props }, ref) => (
  <img
    ref={ref}
    alt={alt}
    className={cn(
      "h-full w-full object-contain p-2",
      className
    )}
    {...props}
  />
))
LogoAvatarImage.displayName = "LogoAvatarImage"

interface LogoAvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  iconSize?: "sm" | "md" | "lg"
}

const iconSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8"
}

const LogoAvatarFallback = React.forwardRef<HTMLDivElement, LogoAvatarFallbackProps>(
  ({ className, iconSize = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center",
        className
      )}
      {...props}
    >
      {children || <Building2 className={cn("text-muted-foreground", iconSizeClasses[iconSize])} />}
    </div>
  )
)
LogoAvatarFallback.displayName = "LogoAvatarFallback"

export { LogoAvatar, LogoAvatarImage, LogoAvatarFallback }
```

### Step 2: Update Public Job Card

**File**: `src/components/public/PublicJobCard.tsx`

Replace circular Avatar with premium LogoAvatar:

```typescript
// Import change
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';

// Replace Avatar usage (around line 87-99)
<LogoAvatar size="md" className="sm:h-12 sm:w-12">
  {job.clients?.logo_url ? (
    <LogoAvatarImage 
      src={job.clients.logo_url} 
      alt={`${companyName} logo`}
      loading="lazy"
    />
  ) : (
    <LogoAvatarFallback iconSize="md" />
  )}
</LogoAvatar>
```

### Step 3: Update Job Details Page

**File**: `src/pages/public/JobDetailsPage.tsx`

Update the larger header logo:

```typescript
// Import change
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';

// Replace Avatar usage (around line 195-206)
<LogoAvatar size="lg" className="lg:h-16 lg:w-16">
  {job.clients?.logo_url ? (
    <LogoAvatarImage 
      src={job.clients.logo_url} 
      alt={`${companyName} logo`}
    />
  ) : (
    <LogoAvatarFallback iconSize="lg" />
  )}
</LogoAvatar>
```

### Step 4: Update Client Logo Upload Preview

**File**: `src/features/clients/components/ClientLogoUpload.tsx`

Update the admin preview to match public display:

```typescript
// Import change
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';

// Replace Avatar usage (around line 142-153)
<LogoAvatar size="xl" className="h-20 w-20">
  {logoUrl ? (
    <LogoAvatarImage 
      src={logoUrl} 
      alt={`${clientName} logo`}
    />
  ) : (
    <LogoAvatarFallback iconSize="lg" />
  )}
</LogoAvatar>
```

### Step 5: Update Organization Management Table

**File**: `src/components/organizations/OrganizationManagement.tsx`

Update inline logo display in table:

```typescript
// Around line 233-235, replace:
{org.logo_url && (
  <img src={org.logo_url} alt={org.name} className="w-8 h-8 object-contain rounded" />
)}

// With:
{org.logo_url ? (
  <div className="w-8 h-8 rounded-xl bg-muted/80 border border-border/50 p-1 flex items-center justify-center">
    <img src={org.logo_url} alt={org.name} className="max-w-full max-h-full object-contain" />
  </div>
) : (
  <div className="w-8 h-8 rounded-xl bg-muted/80 border border-border/50 flex items-center justify-center">
    <Building2 className="w-4 h-4 text-muted-foreground" />
  </div>
)}
```

### Step 6: Update Application Header for Apply Pages

**File**: `src/components/apply/ApplicationHeader.tsx`

Add logo display support with the new premium styling:

```typescript
// Add to imports
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';

// Update interface
interface ApplicationHeaderProps {
  jobTitle?: string | null;
  clientName?: string | null;
  clientLogoUrl?: string | null;  // NEW
  location?: string | null;
  source?: string | null;
  isLoading?: boolean;
}

// Update MetadataBadge for client to include logo
{clientName && (
  <span className="inline-flex items-center gap-2">
    {clientLogoUrl ? (
      <LogoAvatar size="sm" className="h-8 w-8">
        <LogoAvatarImage src={clientLogoUrl} alt={`${clientName} logo`} />
      </LogoAvatar>
    ) : (
      <Building2 className="h-4 w-4" aria-hidden="true" />
    )}
    {clientName}
  </span>
)}
```

### Step 7: Update useApplyContext Hook

**File**: `src/hooks/useApplyContext.ts`

Add `clientLogoUrl` to the context:

```typescript
interface ApplyContext {
  jobTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;  // NEW
  location: string | null;
  jobListingId: string | null;
  source: string | null;
  isLoading: boolean;
}

// In fetch query for public_client_info:
const { data: clientInfo } = await supabase
  .from('public_client_info')
  .select('name, logo_url')  // Add logo_url
  .eq('id', jobListing.client_id)
  .maybeSingle();

clientName = clientInfo?.name || null;
clientLogoUrl = clientInfo?.logo_url || null;  // NEW
```

### Step 8: Update Apply Pages to Pass Logo URL

**Files**:
- `src/pages/Apply.tsx`
- `src/components/apply/detailed/DetailedApplicationForm.tsx`

Pass `clientLogoUrl` from context to `ApplicationHeader`:

```typescript
const { 
  jobTitle, 
  clientName, 
  clientLogoUrl,  // NEW
  location, 
  source,
  isLoading 
} = useApplyContext();

// Pass to ApplicationHeader
<ApplicationHeader 
  jobTitle={jobTitle}
  clientName={clientName}
  clientLogoUrl={clientLogoUrl}  // NEW
  location={location}
  source={source}
  isLoading={isLoading}
/>
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ui/logo-avatar.tsx` | CREATE | Premium app-icon style logo component |
| `src/components/public/PublicJobCard.tsx` | MODIFY | Use LogoAvatar for client logos |
| `src/pages/public/JobDetailsPage.tsx` | MODIFY | Use LogoAvatar for job header |
| `src/features/clients/components/ClientLogoUpload.tsx` | MODIFY | Square logo preview |
| `src/components/organizations/OrganizationManagement.tsx` | MODIFY | Premium logo in table |
| `src/components/apply/ApplicationHeader.tsx` | MODIFY | Add logo display support |
| `src/hooks/useApplyContext.ts` | MODIFY | Add clientLogoUrl to context |
| `src/pages/Apply.tsx` | MODIFY | Pass clientLogoUrl to header |
| `src/components/apply/detailed/DetailedApplicationForm.tsx` | MODIFY | Pass clientLogoUrl to header |

---

## Design Specifications

| Property | Value | Rationale |
|----------|-------|-----------|
| Border radius | `rounded-2xl` (16px) | Matches modern app-icon aesthetic |
| Background | `bg-muted/80` | Subtle, professional backdrop |
| Border | `border border-border/50` | Soft definition without harsh lines |
| Padding | `p-2` | Logo breathing room within container |
| Object fit | `object-contain` | Preserves logo aspect ratio |

---

## Visual Comparison

```text
BEFORE (Circular)
    ╭─────╮
   ╱       ╲
  │  LOGO  │     Company Name
   ╲       ╱
    ╰─────╯
    
AFTER (Premium Square with Rounded Corners)
  ╭─────────╮
  │         │
  │  LOGO   │    Company Name
  │         │
  ╰─────────╯
```

---

## Technical Notes

- User avatars (showing initials) remain circular to distinguish people from brands
- The `rounded-2xl` class provides 16px radius - a premium, modern feel
- `object-contain` ensures logos of various aspect ratios display correctly
- Internal padding prevents logos from touching the rounded edges
- Consistent styling across public pages, admin UI, and apply pages
