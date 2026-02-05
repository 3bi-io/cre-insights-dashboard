

# Add Super Admin CTA on Organization Settings Page

## Summary

Add a Call-to-Action (CTA) card for super admins on the `/settings/organizations` page that links directly to the full Organizations management page (`/admin/organizations`) where they can manage logos for any organization.

## Current Behavior

- The `OrganizationSettings` page at `/settings/organizations` shows the current user's organization details
- Super admins can view/edit their own organization here but must navigate separately to `/admin/organizations` to manage other organizations' logos
- No visual indicator or shortcut exists for super admins

## Proposed Solution

Add a prominent CTA card at the top of the Organization Settings page that:
1. Only appears for `super_admin` users
2. Links to `/admin/organizations` where they can manage all organization logos
3. Uses consistent styling with the existing UI

## Technical Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/settings/OrganizationSettings.tsx` | MODIFY | Add super admin CTA card with link to `/admin/organizations` |

## Implementation Details

**File: `src/pages/settings/OrganizationSettings.tsx`**

1. Import additional components:
```typescript
import { Link } from 'react-router-dom';
import { ExternalLink, Crown } from 'lucide-react';
```

2. Add `isSuperAdmin` check:
```typescript
const isSuperAdmin = userRole === 'super_admin';
```

3. Add CTA card after the page header (before the main Card):
```typescript
{isSuperAdmin && (
  <Card className="border-primary/20 bg-primary/5">
    <CardContent className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Super Admin Access</p>
          <p className="text-sm text-muted-foreground">
            Manage logos and branding for all organizations
          </p>
        </div>
      </div>
      <Button asChild>
        <Link to="/admin/organizations">
          Manage All Organizations
          <ExternalLink className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </CardContent>
  </Card>
)}
```

## Visual Result

```text
┌─────────────────────────────────────────────────────────────┐
│ Organization Settings                                        │
│ Manage your organization's information                       │
├─────────────────────────────────────────────────────────────┤
│ 👑 Super Admin Access                                        │ ← NEW (only for super_admin)
│ Manage logos and branding for all organizations              │
│                                    [Manage All Organizations]│
├─────────────────────────────────────────────────────────────┤
│ Organization Details Card                                    │
│ ...existing content...                                       │
├─────────────────────────────────────────────────────────────┤
│ Logo Upload Card                                             │
│ ...existing content...                                       │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Quick Access**: Super admins can immediately navigate to manage all organization logos
2. **Context Awareness**: CTA appears only when relevant (super_admin role)
3. **Consistent UX**: Uses existing card styling with subtle primary color accent
4. **Non-intrusive**: Doesn't affect the experience for regular admins or users

