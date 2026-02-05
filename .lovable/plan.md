
# Add Organization Logo Management for Super Admin

## Summary

Add a dedicated logo management button to each organization card on the `/admin/organizations` page, allowing Super Admins to upload, update, or delete organization logos directly without navigating to organization settings.

## Changes Overview

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/OrganizationLogoDialog.tsx` | CREATE | New dialog component for logo management |
| `src/hooks/useAdminDashboardData.tsx` | MODIFY | Add `logo_url` to organizations query |
| `src/pages/Organizations.tsx` | MODIFY | Add logo button and display current logo |

## Technical Details

### 1. Update useOrganizationsData Query

**File: `src/hooks/useAdminDashboardData.tsx`**

Update the `OrganizationData` interface and query to include `logo_url`:

```typescript
interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;  // ADD
  created_at: string;
  subscription_status: string;
  plan_type?: 'free' | 'starter' | 'professional' | 'enterprise';
  userCount: number;
  jobCount: number;
  applicationCount: number;
  monthlySpend: number;
}
```

Update the query select:
```typescript
const { data: organizations } = await supabase
  .from('organizations')
  .select(`
    id,
    name,
    slug,
    logo_url,  // ADD
    created_at,
    subscription_status,
    plan_type
  `);
```

Update the return mapping:
```typescript
return {
  ...
  logo_url: org.logo_url,  // ADD
  ...
};
```

### 2. Create OrganizationLogoDialog Component

**File: `src/components/admin/OrganizationLogoDialog.tsx`**

Create a new dialog component that wraps the existing `OrganizationLogoUpload`:

```typescript
interface OrganizationLogoDialogProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  };
  trigger?: React.ReactNode;
}
```

Features:
- Uses existing `OrganizationLogoUpload` component
- Invalidates query cache on logo update
- Shows current logo preview in trigger button
- Displays organization name in dialog header

### 3. Update Organizations Page

**File: `src/pages/Organizations.tsx`**

Add logo display and management button to each organization card:

**Imports to add:**
```typescript
import { OrganizationLogoDialog } from '@/components/admin/OrganizationLogoDialog';
import { CompanyLogo } from '@/components/shared';
import { Image as ImageIcon } from 'lucide-react';
```

**Update card header to show logo:**
```typescript
<div className="flex items-center gap-3">
  <CompanyLogo
    logoUrl={org.logo_url}
    companyName={org.name}
    size="sm"
  />
  <div>
    <CardTitle className="text-base">{org.name}</CardTitle>
    <CardDescription>{org.slug}</CardDescription>
  </div>
</div>
```

**Add logo management button to actions:**
```typescript
<OrganizationLogoDialog organization={org} />
```

## Visual Layout After Changes

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]  Organization Name                                      │
│          organization-slug                                      │
│                                                                 │
│  [Features] [Platforms] [Logo] [Edit] [Users] [Delete]         │
│                                                                 │
│  Users: 15    Active Jobs: 8    Applications: 234    $5,000    │
└─────────────────────────────────────────────────────────────────┘
```

## Query Cache Invalidation

When a logo is updated via the dialog:
1. Call `queryClient.invalidateQueries({ queryKey: ['admin-organizations-data'] })`
2. This refreshes the organizations list to show the new logo immediately

## Component Structure

```
OrganizationLogoDialog
├── Dialog trigger button (ImageIcon + "Logo")
├── DialogContent
│   ├── DialogHeader (Organization name)
│   └── OrganizationLogoUpload (existing component)
│       ├── Current logo display
│       ├── Drag-and-drop upload area
│       └── Delete button
```

## Benefits

1. **Direct Access**: Super Admins can manage logos without navigating to org settings
2. **Reuse**: Leverages existing `OrganizationLogoUpload` component
3. **Visual Feedback**: Logo displayed directly on organization cards
4. **Consistency**: Uses same upload/delete logic as org settings page
