# Application Management Feature

Centralized application management system for handling job applicants, their data, and workflows.

## Structure

```
src/features/applications/
├── types/                      # TypeScript type definitions
│   └── index.ts               # Application and related types
├── constants/                 # Static configurations
│   └── statusConfig.ts        # Status color mappings and options
├── services/                  # API service layer
│   ├── applicationService.ts  # Application CRUD operations
│   └── index.ts              # Service exports
├── hooks/                     # React hooks
│   ├── useApplicationData.ts  # Data fetching hooks
│   ├── useApplicationMutations.ts # Mutation hooks
│   └── index.ts              # Hook exports
└── utils/                     # Utility functions
    ├── applicationFormatters.ts # Formatting utilities
    ├── applicationFilters.ts   # Filtering utilities
    ├── applicationStats.ts     # Statistics calculations
    └── index.ts               # Utility exports
```

## Key Improvements

### 1. **Centralized Type Safety**
- All application-related types in one place
- Extended type definitions for forms and updates
- Better IDE autocomplete and type checking
- Reusable across components

### 2. **Service Layer Pattern**
- `ApplicationService`: Handles all application CRUD operations
- Separation of concerns from UI components
- Consistent error handling
- Easier to test and mock

### 3. **Reusable Hooks**
- `useApplicationData`: Fetches all applications with caching
- `useApplication`: Fetches single application
- `useJobApplications`: Fetches applications for specific job
- `useApplicationMutations`: Handles create, update, delete operations
- Built-in loading and error states
- Automatic query invalidation

### 4. **Utility Functions**
#### Formatters
- `getApplicantName`: Name with intelligent fallback
- `getApplicantEmail`: Email with fallback
- `getApplicantLocation`: Formatted location string
- `getClientName`: Client from job relationship
- `getJobTitle`: Job title from relationship
- `getApplicantCategory`: CDL categorization (D, SC, SR, N/A)
- `formatApplicationDate`: Full date formatting
- `formatShortDate`: Compact date display

#### Filters
- `filterApplications`: Multi-criteria filtering
- `getUniqueSources`: Extract unique application sources
- `getUniqueOrganizations`: Extract unique organizations

#### Stats
- `calculateApplicationStats`: Complete statistics
- `getStatusCounts`: Count by status
- `getCategoryCounts`: Count by category (D, SC, SR, N/A)
- `getSourceCounts`: Count by source

### 5. **Status Management**
- Centralized status colors and configurations
- Type-safe status values
- Consistent UI rendering

## Usage Examples

### Using Application Data
```tsx
import { useApplicationData } from '@/features/applications';

const MyComponent = () => {
  const { applications, isLoading, refetch } = useApplicationData();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {applications?.map(app => (
        <div key={app.id}>{/* render application */}</div>
      ))}
    </div>
  );
};
```

### Using Application Mutations
```tsx
import { useApplicationMutations } from '@/features/applications';

const ApplicationActions = ({ applicationId }) => {
  const {
    updateStatus,
    assignRecruiter,
    deleteApplication,
    isUpdating
  } = useApplicationMutations();
  
  const handleStatusChange = (newStatus) => {
    updateStatus({ id: applicationId, status: newStatus });
  };
  
  return (
    // Your UI
  );
};
```

### Using Formatters
```tsx
import { 
  getApplicantName, 
  getApplicantCategory,
  getApplicantLocation 
} from '@/features/applications';

const ApplicationCard = ({ application }) => {
  const name = getApplicantName(application);
  const category = getApplicantCategory(application);
  const location = getApplicantLocation(application);
  
  return (
    <div>
      <h3>{name}</h3>
      <Badge className={category.color}>{category.code}</Badge>
      <p>{location}</p>
    </div>
  );
};
```

### Using Filters
```tsx
import { filterApplications, useApplicationData } from '@/features/applications';

const FilteredApplications = () => {
  const { applications } = useApplicationData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = filterApplications(applications || [], {
    searchTerm,
    categoryFilter: 'all',
    sourceFilter: 'all',
    statusFilter: 'pending'
  });
  
  return (
    // Render filtered applications
  );
};
```

### Using Statistics
```tsx
import { calculateApplicationStats, useApplicationData } from '@/features/applications';

const ApplicationStats = () => {
  const { applications } = useApplicationData();
  const stats = calculateApplicationStats(applications || []);
  
  return (
    <div>
      <div>Total: {stats.total}</div>
      <div>Pending: {stats.byStatus.pending || 0}</div>
      <div>Drivers (D): {stats.byCategory.D || 0}</div>
    </div>
  );
};
```

### Using Application Service Directly
```tsx
import { ApplicationService } from '@/features/applications';

const handleCreateApplication = async (formData) => {
  try {
    const application = await ApplicationService.createApplication({
      job_listing_id: jobId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      applicant_email: formData.email,
      // ... other fields
    });
    
    console.log('Created:', application.id);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

## Benefits

1. **Better Code Organization**: Clear separation between data, logic, and UI
2. **Type Safety**: Comprehensive TypeScript types prevent errors
3. **Reusability**: Shared hooks, services, and utilities across components
4. **Maintainability**: Single source of truth for application logic
5. **Testability**: Services and utilities easily mocked and tested
6. **Performance**: Optimized caching with React Query
7. **Developer Experience**: Better autocomplete and inline documentation
8. **Consistency**: Standardized formatting and filtering logic

## Application Categories

The system automatically categorizes applicants based on their qualifications:

- **D (Experienced Driver)**: Has CDL + Age 21+ + 3+ months experience
- **SC (Student/New CDL)**: Has CDL + Age 21+ + < 3 months experience
- **SR (Student Ready)**: No CDL + Age 21+ + < 3 months experience
- **N/A (Uncategorized)**: Doesn't fit above categories

## Migration Guide

Old components can gradually adopt the new structure:

```tsx
// Old way
const { data } = useQuery({
  queryKey: ['applications'],
  queryFn: async () => {
    const { data } = await supabase.from('applications').select('*');
    return data;
  }
});

// New way
import { useApplicationData } from '@/features/applications';
const { applications } = useApplicationData();
```

```tsx
// Old way - duplicated formatting logic
const name = app.first_name && app.last_name 
  ? `${app.first_name} ${app.last_name}` 
  : 'Anonymous';

// New way - centralized utility
import { getApplicantName } from '@/features/applications';
const name = getApplicantName(app);
```

## Future Enhancements

- [ ] Add bulk operations (bulk status update, bulk assign)
- [ ] Implement application scoring/ranking system
- [ ] Add application timeline/activity tracking
- [ ] Create application templates
- [ ] Add advanced search with saved filters
- [ ] Implement application export functionality
- [ ] Add email/SMS integration utilities
- [ ] Create application workflow automation
