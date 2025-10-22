# Organization Features Module

## Overview
This module provides a centralized, type-safe system for managing organization-specific features in the application. It includes feature configuration, service layer, TypeScript types, and hooks for both regular users and administrators.

## Architecture

### 1. Types (`types/features.types.ts`)
Defines all TypeScript interfaces and types:
- `FeatureKey`: Union type of all available feature keys (type-safe)
- `FeatureCategory`: Feature grouping categories
- `FeatureConfig`: Configuration structure for each feature
- `OrganizationFeature`: Database record structure
- `OrganizationFeaturesMap`: Quick lookup map for feature status
- `FeatureUpdatePayload`: Mutation payload structure

### 2. Configuration (`config/organizationFeatures.config.ts`)
Single source of truth for all features:
- `ORGANIZATION_FEATURES`: Complete feature definitions with metadata
- `getAllFeatures()`: Get all features as array
- `getFeaturesByCategory()`: Get features grouped by category
- `getFeatureConfig(key)`: Get specific feature configuration
- `isValidFeatureKey(key)`: Validate feature key
- Helper functions for icons and styling

#### Available Features:
- **AI Category:**
  - `openai_access`: OpenAI GPT models
  - `anthropic_access`: Anthropic Claude models
  - `grok_access`: xAI Grok models
  - `voice_agent`: AI voice screening
  - `elevenlabs_access`: ElevenLabs voice synthesis

- **Advertising Category:**
  - `meta_integration`: Meta/Facebook advertising

- **Integration Category:**
  - `tenstreet_access`: Tenstreet ATS integration

- **Analytics Category:**
  - `advanced_analytics`: Advanced reporting

### 3. Service Layer (`services/organizationFeaturesService.ts`)
Handles all database operations:
- `fetchOrganizationFeatures(orgId)`: Fetch all features for organization
- `fetchOrganizationFeaturesMap(orgId)`: Fetch as key-value map
- `updateOrganizationFeatures(orgId, features)`: Update features via RPC
- `hasFeatureEnabled(orgId, featureKey)`: Check single feature status
- `checkMultipleFeatures(orgId, keys)`: Batch check multiple features

**Error Handling:**
- Validates feature keys before database operations
- Provides detailed error messages
- Filters invalid features from database results

### 4. Hooks

#### `useOrganizationFeatures()` (User Hook)
For checking feature access in components:
```typescript
const {
  features,           // Feature status map
  isLoading,          // Loading state
  isError,            // Error state
  hasFeature,         // Generic feature check
  hasOpenAIAccess,    // Specific feature checks
  hasAIAccess,        // Composite checks
} = useOrganizationFeatures();
```

**Key Features:**
- Super admins bypass all checks (always return true)
- Caches results for 5 minutes
- Automatic retry on failure
- Type-safe feature checking

#### `useOrganizationFeaturesAdmin()` (Admin Hook)
For managing features (admin only):
```typescript
const {
  features,           // Array of OrganizationFeature
  availableFeatures,  // All available features from config
  isLoading,
  isError,
  updateFeatures,     // Mutation function
  isUpdating,
  refetch,
} = useOrganizationFeaturesAdmin(organizationId);
```

**Key Features:**
- Validates all feature keys before update
- Invalidates related queries on success
- Toast notifications for success/error
- Type-safe mutations

## Usage Examples

### Check Feature Access
```typescript
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

function MyComponent() {
  const { hasOpenAIAccess, hasFeature } = useOrganizationFeatures();
  
  if (hasOpenAIAccess()) {
    // Show OpenAI features
  }
  
  if (hasFeature('voice_agent')) {
    // Show voice agent UI
  }
}
```

### Manage Features (Admin)
```typescript
import { useOrganizationFeaturesAdmin } from '@/hooks/useOrganizationFeaturesAdmin';

function AdminPanel({ organizationId }) {
  const { 
    availableFeatures, 
    updateFeatures, 
    isUpdating 
  } = useOrganizationFeaturesAdmin(organizationId);
  
  const handleToggle = async () => {
    await updateFeatures({
      orgId: organizationId,
      features: {
        openai_access: { enabled: true },
        voice_agent: { enabled: false },
      }
    });
  };
}
```

### Add New Feature
1. Add feature key to `FeatureKey` type
2. Add configuration to `ORGANIZATION_FEATURES`
3. Add icon mapping to `getFeatureIcon()` if needed
4. Feature is now available throughout the app

## Benefits of Refactor

### Before:
- ❌ Features defined in multiple files
- ❌ No type safety for feature keys
- ❌ Duplicate database query logic
- ❌ Missing features in admin interface
- ❌ No validation

### After:
- ✅ Single source of truth
- ✅ Full TypeScript type safety
- ✅ Centralized service layer
- ✅ All features available everywhere
- ✅ Input validation and error handling
- ✅ Better code organization
- ✅ Easier to add new features
- ✅ Consistent behavior across app

## Database Schema

### Table: `organization_features`
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `feature_name`: TEXT (indexed)
- `enabled`: BOOLEAN
- `settings`: JSONB (optional config)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### RPC Function: `update_organization_features`
Parameters:
- `_org_id`: UUID
- `_features`: JSONB (feature updates)

## Error Handling

All operations include comprehensive error handling:
- Invalid feature keys throw validation errors
- Database errors are logged and returned to UI
- Missing features default to `false` (disabled)
- Super admin checks bypass feature restrictions

## Performance

- Query results cached (2-5 minutes)
- Batch operations for multiple feature checks
- Optimized with proper indexes
- Minimal re-renders with memoization

## Testing Recommendations

1. Test super admin access (should bypass all checks)
2. Test feature toggling and persistence
3. Test invalid feature key handling
4. Test concurrent feature updates
5. Test cache invalidation after updates
