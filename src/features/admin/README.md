# Admin & Organization Management Feature

Centralized admin and organization management system with RBAC (Role-Based Access Control).

## Structure

```
src/features/admin/
├── types/                          # TypeScript type definitions
│   └── index.ts                   # Admin, organization, and user types
├── services/                      # API service layer
│   ├── organizationService.ts     # Organization CRUD operations
│   ├── userManagementService.ts   # User and role management
│   ├── adminMetricsService.ts     # Admin metrics and statistics
│   └── index.ts                   # Service exports
└── hooks/                         # React hooks
    ├── useAdminMetrics.ts         # Admin dashboard metrics
    ├── useOrganizationData.ts     # Organization data fetching
    ├── useOrganizationMutations.ts # Organization mutations
    ├── useUserData.ts             # User data fetching
    ├── useUserMutations.ts        # User mutations
    └── index.ts                   # Hook exports
```

## Key Improvements

### 1. **Centralized Type Safety**
- All admin and organization types in one place
- Role-based access control types
- Consistent interfaces for permissions
- Better IDE autocomplete

### 2. **Service Layer Pattern**
- `OrganizationService`: Organization CRUD and features
- `UserManagementService`: User and role management
- `AdminMetricsService`: Dashboard metrics and statistics
- Separation of concerns from UI
- Easier testing and mocking

### 3. **Reusable Hooks**
- `useAdminMetrics`: Dashboard metrics with caching
- `useOrganizations`: Organization data management
- `useOrganizationMutations`: Create, update, delete organizations
- `useUsers`: User data management
- `useUserMutations`: User and role mutations
- Automatic query invalidation
- Built-in error handling

### 4. **RBAC Integration**
- Role checking utilities (`hasRole`, `isSuperAdmin`)
- Current user role retrieval
- Organization-scoped permissions
- Platform access control

## Usage Examples

### Using Admin Metrics
```tsx
import { useAdminMetrics } from '@/features/admin';

const AdminDashboard = () => {
  const { metrics, isLoading } = useAdminMetrics();
  
  return (
    <div>
      <MetricCard title="Total Organizations" value={metrics?.totalOrganizations} />
      <MetricCard title="Total Users" value={metrics?.totalUsers} />
    </div>
  );
};
```

### Managing Organizations
```tsx
import { useOrganizations, useOrganizationMutations } from '@/features/admin';

const OrganizationManagement = () => {
  const { organizations, isLoading } = useOrganizations();
  const {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isCreating
  } = useOrganizationMutations();
  
  const handleCreate = () => {
    createOrganization({
      name: 'New Org',
      slug: 'new-org',
      adminEmail: 'admin@example.com'
    });
  };
  
  return (
    // Your UI
  );
};
```

### Managing Users
```tsx
import { useOrganizationUsers, useUserMutations } from '@/features/admin';

const UserManagement = ({ organizationId }) => {
  const { users, isLoading } = useOrganizationUsers(organizationId);
  const { updateUserStatus, assignRole } = useUserMutations();
  
  const handleDisableUser = (userId: string) => {
    updateUserStatus({ userId, enabled: false });
  };
  
  const handleMakeAdmin = (userId: string) => {
    assignRole({
      user_id: userId,
      role: 'admin',
      organization_id: organizationId
    });
  };
  
  return (
    // Your UI
  );
};
```

### Using Services Directly
```tsx
import { OrganizationService, UserManagementService } from '@/features/admin';

// Check if user is super admin
const checkAdminAccess = async (userId: string) => {
  const isSuperAdmin = await UserManagementService.isSuperAdmin(userId);
  if (!isSuperAdmin) {
    throw new Error('Access denied');
  }
};

// Update organization features
const enableFeature = async (orgId: string) => {
  await OrganizationService.updateOrganizationFeatures(orgId, {
    ai_analytics: { enabled: true, settings: {} }
  });
};

// Set platform access
const updatePlatformAccess = async (orgId: string) => {
  await OrganizationService.setOrganizationPlatformAccess(
    orgId,
    'meta',
    true
  );
};
```

## Benefits

1. **Better Code Organization**: Clear separation of admin, org, and user logic
2. **Type Safety**: Comprehensive TypeScript types prevent errors
3. **Reusability**: Shared hooks and services across admin components
4. **Maintainability**: Single source of truth for admin operations
5. **Security**: Centralized RBAC checks and permissions
6. **Performance**: Optimized caching with React Query
7. **Developer Experience**: Better autocomplete and documentation
8. **Scalability**: Easy to extend with new admin features

## Role Hierarchy

- **super_admin**: Full system access, manage all organizations
- **admin**: Organization-level access, manage users and settings
- **moderator**: Limited administrative access
- **user**: Standard user access

## Security Features

- Row-level security integration
- Organization-scoped permissions
- Platform access control per organization
- User enable/disable functionality
- Audit logging support

## Migration Guide

Old admin components can gradually adopt the new structure:

```tsx
// Old way
const { data } = useQuery({
  queryKey: ['admin-metrics'],
  queryFn: async () => { /* fetch logic */ }
});

// New way
import { useAdminMetrics } from '@/features/admin';
const { metrics } = useAdminMetrics();
```

```tsx
// Old way - direct database calls
const { data } = await supabase.from('organizations').select('*');

// New way - centralized service
import { OrganizationService } from '@/features/admin';
const organizations = await OrganizationService.fetchOrganizations();
```

## Future Enhancements

- [ ] Add audit log viewer
- [ ] Implement billing and subscription management
- [ ] Add organization templates
- [ ] Create admin notification system
- [ ] Implement bulk user operations
- [ ] Add advanced permission management
- [ ] Create organization health monitoring
- [ ] Add compliance reporting tools
