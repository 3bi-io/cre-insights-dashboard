

# Add Social Beacon to Super Admin Navigation and Organization Features

## Summary

This plan adds Social Beacon navigation items to the Super Admin menu and registers Social Beacon as an assignable organization feature, enabling administrators to grant or revoke Social Beacon access per organization.

## Changes Overview

| File | Action | Purpose |
|------|--------|---------|
| `src/features/organizations/types/features.types.ts` | MODIFY | Add `social_beacon` to `FeatureKey` union type |
| `src/features/organizations/config/organizationFeatures.config.ts` | MODIFY | Add Social Beacon feature configuration |
| `src/components/FeatureGuard.tsx` | MODIFY | Add `social_beacon` to feature type union and names map |
| `src/hooks/useOrganizationFeatures.tsx` | MODIFY | Add `hasSocialBeacon()` helper function |
| `src/config/navigationConfig.ts` | MODIFY | Add Social Beacon navigation items to Super Admin section |
| `src/config/navigationConfig.ts` | MODIFY | Add route titles for Social Beacon pages |

## Technical Details

### 1. Add Feature Type Definition

**File: `src/features/organizations/types/features.types.ts`**

Add `social_beacon` to the `FeatureKey` type union:

```typescript
export type FeatureKey =
  | 'meta_integration'
  | 'openai_access'
  | 'anthropic_access'
  | 'grok_access'
  | 'tenstreet_access'
  | 'voice_agent'
  | 'elevenlabs_access'
  | 'advanced_analytics'
  | 'background_check_access'
  | 'social_beacon';  // NEW
```

Add `'Social'` to the `FeatureCategory` type:

```typescript
export type FeatureCategory = 'AI' | 'Advertising' | 'Integration' | 'Analytics' | 'Screening' | 'Social';
```

### 2. Add Feature Configuration

**File: `src/features/organizations/config/organizationFeatures.config.ts`**

Add Social Beacon to the `ORGANIZATION_FEATURES` constant:

```typescript
social_beacon: {
  key: 'social_beacon',
  name: 'social_beacon',
  label: 'Social Beacon',
  description: 'AI-powered social media distribution and engagement across platforms',
  category: 'Social',
  premium: true,
},
```

Add icon mapping in `getFeatureIcon`:

```typescript
case 'social_beacon':
  return Antenna;
```

Add category color in `getCategoryColor`:

```typescript
case 'Social':
  return 'bg-pink-100 text-pink-800 border-pink-200';
```

Import `Antenna` icon from lucide-react.

### 3. Update FeatureGuard Component

**File: `src/components/FeatureGuard.tsx`**

Update the `FeatureGuardProps` interface feature type:

```typescript
feature: 'tenstreet_access' | 'openai_access' | 'anthropic_access' | 'grok_access' | 'meta_integration' | 'voice_agent' | 'advanced_analytics' | 'elevenlabs_access' | 'background_check_access' | 'social_beacon';
```

Add to `FEATURE_NAMES`:

```typescript
social_beacon: 'Social Beacon'
```

Add to `useFeatureGuard` hook:

```typescript
canAccessSocialBeacon: () => hasFeature('social_beacon'),
```

### 4. Update Organization Features Hook

**File: `src/hooks/useOrganizationFeatures.tsx`**

Add helper function for Social Beacon access:

```typescript
const hasSocialBeacon = () => hasFeature('social_beacon');
```

Export in return object:

```typescript
return {
  // ... existing exports
  hasSocialBeacon,
};
```

### 5. Add Super Admin Navigation Items

**File: `src/config/navigationConfig.ts`**

Import the `Antenna` icon:

```typescript
import { ..., Antenna } from 'lucide-react';
```

Add Social Beacon items to the Super Admin "Administration" group (around line 220):

```typescript
...(isSuperAdmin ? [{
  group: "Administration",
  icon: Building,
  items: [
    { path: '/admin/organizations', label: 'Organizations', icon: Building },
    { path: '/admin/user-management', label: 'User Management', icon: UserCog },
    { path: '/admin/super-admin-feeds', label: 'Feed Management', icon: Rss },
    { path: '/admin/media', label: 'Media Assets', icon: Image },
    { path: '/admin/social-beacons', label: 'Social Beacons', icon: Antenna },  // NEW
  ]
}] : [])
```

Alternatively, create a dedicated "Social" group for Super Admins to better organize social-related items:

```typescript
...(isSuperAdmin ? [{
  group: "Social",
  icon: Antenna,
  items: [
    { path: '/admin/social-beacons', label: 'Social Beacons', icon: Antenna },
    { path: '/admin/social-engagement', label: 'Engagement Dashboard', icon: MessageSquare },
  ]
}] : [])
```

### 6. Add Route Titles

**File: `src/config/navigationConfig.ts`**

Add to `routeTitles`:

```typescript
'/admin/social-beacons': 'Social Beacons',
'/admin/social-engagement': 'Social Engagement',
```

## Navigation Structure (After Changes)

```text
Administration (Super Admin only)
├── Organizations
├── User Management
├── Feed Management
├── Media Assets
└── Social Beacons          <-- NEW

Social (Super Admin only)    <-- NEW GROUP (optional)
├── Social Beacons
└── Engagement Dashboard
```

## Feature Configuration Summary

| Property | Value |
|----------|-------|
| Key | `social_beacon` |
| Label | Social Beacon |
| Category | Social |
| Description | AI-powered social media distribution and engagement across platforms |
| Premium | Yes |

## Database Consideration

The `organization_features` table accepts any string as `feature_name`. Once this code is deployed, Super Admins can enable `social_beacon` for organizations via the Organizations management panel. No database migration is required.

## Usage After Implementation

**Enable for an Organization:**
1. Super Admin navigates to Organizations
2. Opens the organization's Features dialog
3. Toggles "Social Beacon" to enabled
4. Organization users can now access Social Engagement features

**Access Check in Components:**
```typescript
const { hasSocialBeacon } = useOrganizationFeatures();

if (hasSocialBeacon()) {
  // Show Social Beacon features
}
```

**FeatureGuard Usage:**
```typescript
<FeatureGuard feature="social_beacon" featureName="Social Beacon">
  <SocialEngagementDashboard />
</FeatureGuard>
```

