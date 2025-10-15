# Platform Integration Layer

Centralized platform management system for advertising platforms and integrations.

## Structure

```
src/features/platforms/
├── types/                  # TypeScript type definitions
│   └── index.ts           # Platform, Meta, and integration types
├── constants/             # Static configurations
│   └── platformConfigs.ts # Platform metadata and configs
├── services/              # API service layer
│   ├── metaService.ts    # Meta API operations
│   ├── platformService.ts # Platform CRUD operations
│   └── index.ts          # Service exports
├── hooks/                 # React hooks
│   ├── usePlatformData.ts # Platform data fetching
│   ├── useMetaData.ts    # Meta data fetching hooks
│   └── index.ts          # Hook exports
├── utils/                 # Utility functions
│   └── dateUtils.ts      # Date range calculations
├── components/            # React components (re-exported)
│   └── index.ts          # Component exports
└── pages/                 # Page components
    └── PlatformsPage.tsx # Main platforms page
```

## Key Improvements

### 1. **Centralized Type Safety**
- All platform and Meta-related types in one place
- Consistent interfaces across the application
- Better IDE autocomplete and type checking

### 2. **Service Layer Pattern**
- `MetaService`: Handles all Meta API operations
- `PlatformService`: Handles platform CRUD operations
- Separation of concerns from UI components
- Easier to test and mock

### 3. **Reusable Hooks**
- `usePlatformData`: Fetches platform list with caching
- `useMetaAccounts`, `useMetaCampaigns`, etc.: Individual Meta data hooks
- `useMetaIntegration`: Aggregated hook for all Meta data
- Consistent query key strategy
- Built-in loading and error states

### 4. **Utility Functions**
- Date range utilities (`getMetaDatePreset`, `getSinceDays`, `getStartDate`)
- Reusable across components
- Single source of truth for date calculations

### 5. **Static Configurations**
- Platform configs moved to constants
- Easy to add/remove platforms
- Centralized metadata management

## Usage Examples

### Using Platform Data
```tsx
import { usePlatformData } from '@/features/platforms';

const MyComponent = () => {
  const { platforms, isLoading, refetch } = usePlatformData();
  
  return (
    // Your UI
  );
};
```

### Using Meta Integration
```tsx
import { useMetaIntegration } from '@/features/platforms';

const MetaComponent = () => {
  const {
    accounts,
    campaigns,
    adSets,
    spend,
    isLoading,
    refetchCampaigns
  } = useMetaIntegration('account_id', 'last_30d');
  
  return (
    // Your UI
  );
};
```

### Using Meta Service
```tsx
import { MetaService } from '@/features/platforms';

const handleSync = async () => {
  const result = await MetaService.syncCampaigns(accountId, 'last_30d');
  
  if (result.success) {
    toast({ title: result.message });
  } else {
    toast({ title: result.error, variant: 'destructive' });
  }
};
```

### Using Platform Service
```tsx
import { PlatformService } from '@/features/platforms';

const handleCreatePlatform = async (data) => {
  const platform = await PlatformService.createPlatform({
    name: data.name,
    logo_url: data.logoUrl,
    api_endpoint: data.apiEndpoint,
    organization_id: orgId
  });
  
  refetch();
};
```

## Benefits

1. **Better Code Organization**: Clear separation of concerns
2. **Type Safety**: Comprehensive TypeScript types
3. **Reusability**: Shared hooks and services
4. **Maintainability**: Single source of truth for platform logic
5. **Testability**: Services can be easily mocked and tested
6. **Performance**: Optimized query caching strategies
7. **Developer Experience**: Better autocomplete and documentation

## Migration Guide

Old components can gradually adopt the new structure:

```tsx
// Old way
const { data, error } = await supabase.from('platforms').select('*');

// New way
import { PlatformService } from '@/features/platforms';
const platforms = await PlatformService.fetchPlatforms();
```

```tsx
// Old way
const { data } = useQuery({
  queryKey: ['platforms'],
  queryFn: async () => { /* fetch logic */ }
});

// New way
import { usePlatformData } from '@/features/platforms';
const { platforms } = usePlatformData();
```

## Future Enhancements

- [ ] Add error boundary for platform components
- [ ] Implement optimistic updates for mutations
- [ ] Add platform-specific validation schemas
- [ ] Create platform analytics aggregation utilities
- [ ] Add webhook management services
- [ ] Implement platform health monitoring
