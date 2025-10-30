# Phase 2 Migration Guide - Code Quality & Performance

## ✅ Completed Tasks

### 1. Environment-Aware Logger Created
- **File**: `src/lib/logger.ts`
- **Purpose**: Prevents sensitive data exposure in production
- **Usage**:
  ```typescript
  import { logger } from '@/lib/logger';
  
  // Debug logs (dev only)
  logger.log('User data loaded', { userId: user.id });
  logger.debug('Cache hit', { key: cacheKey });
  
  // Warnings (always logged, monitored in production)
  logger.warn('API rate limit approaching', { remaining: 10 });
  
  // Errors (always logged, sent to monitoring)
  logger.error('Failed to fetch data', error, { endpoint: '/api/users' });
  ```

### 2. Standardized Query Keys Created
- **File**: `src/lib/queryKeys.ts`
- **Purpose**: Centralize React Query keys for consistency
- **Usage**:
  ```typescript
  import { queryKeys } from '@/lib/queryKeys';
  
  // Before (inconsistent)
  useQuery({ queryKey: ['orgs', orgId] });
  useQuery({ queryKey: ['organizations', orgId] });
  
  // After (standardized)
  useQuery({ 
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: () => fetchOrganization(orgId)
  });
  
  // Cache invalidation
  queryClient.invalidateQueries({ 
    queryKey: queryKeys.organizations.all 
  });
  ```

### 3. TypeScript Configuration - MANUAL REQUIRED ⚠️
**Status**: Cannot modify read-only `tsconfig.json`

**Required Manual Changes**:
Edit `tsconfig.json` and update:
```json
{
  "compilerOptions": {
    "strict": true,              // ✅ Enable all strict checks
    "noImplicitAny": true,       // ✅ No implicit any types
    "strictNullChecks": true,    // ✅ Strict null checking
    "noUnusedParameters": true,  // ✅ Flag unused params
    "noUnusedLocals": true       // ✅ Flag unused variables
  }
}
```

**⚠️ WARNING**: This will generate ~100-200 TypeScript errors that need fixing!

### 4. DevTools Production Guard Added
- **File**: `src/App.tsx`
- **Change**: DevTools now only render in development mode
- **Before**: Always visible
- **After**: `{isDevelopment && <DevTools />}`

---

## 🔄 TODO: Console Statement Replacement

**Status**: 326 console statements found across 105 files

### Automated Replacement Strategy

#### Step 1: Find & Replace Patterns

**Pattern 1: Simple console.log**
```typescript
// Find: console.log\((.*?)\);
// Replace with: logger.log($1);
```

**Pattern 2: console.error with error object**
```typescript
// Find: console.error\('(.*?)', (error|err)\);
// Replace with: logger.error('$1', $2);
```

**Pattern 3: console.warn**
```typescript
// Find: console.warn\((.*?)\);
// Replace with: logger.warn($1);
```

#### Step 2: Import Statement
Add to all modified files:
```typescript
import { logger } from '@/lib/logger';
```

#### Step 3: High-Priority Files (Replace First)

**Critical Security/Auth Files:**
- `src/hooks/useAuth.tsx` - 12 console statements
- `src/components/ProtectedRoute.tsx` - Any auth logging
- `src/features/auth/**/*` - All auth-related files

**Error Handling Files:**
- `src/components/error/**/*` - All error boundaries
- `src/components/debug/**/*` - Debug tools
- `src/services/errorService.ts` - Error tracking

**API/Integration Files:**
- `src/components/platforms/**/*` - Platform integrations (33 files)
- `src/components/applications/**/*` - Application processing
- `supabase/functions/**/*` - Edge functions (already using Deno.log)

### Manual Replacement Required For:

1. **Structured Logging** (Replace console.log with context):
   ```typescript
   // Before
   console.log('Fetching Meta accounts for actual ID:', accountId);
   console.log('Meta accounts fetched:', data?.length);
   
   // After
   logger.log('Fetching Meta accounts', { accountId, actualId: CR_ENGLAND_ACTUAL_ID });
   logger.log('Meta accounts fetched', { count: data?.length, accountId });
   ```

2. **Error Context** (Add meaningful context):
   ```typescript
   // Before
   console.error('Error updating job:', error);
   
   // After
   logger.error('Failed to update job listing', error, { 
     jobId: job.id, 
     userId: user.id,
     organizationId: org.id 
   });
   ```

3. **Remove Debug Logs** (Some are no longer needed):
   ```typescript
   // Before
   console.log('MetaAdSetReport component - data:', data);
   console.log('MetaAdSetReport component - isLoading:', isLoading);
   console.log('MetaAdSetReport component - error:', error);
   
   // After (remove - React Query DevTools shows this)
   // Delete these debug logs
   ```

---

## 🎯 TODO: Query Key Standardization

**Status**: 321 useQuery/useMutation calls need standardization

### Migration Strategy

#### Step 1: Import Query Keys
```typescript
import { queryKeys } from '@/lib/queryKeys';
```

#### Step 2: Replace Query Keys Systematically

**Organizations:**
```typescript
// Before
useQuery({ queryKey: ['organizations'] });
useQuery({ queryKey: ['organization', orgId] });
useQuery({ queryKey: ['org-stats', orgId] });

// After
useQuery({ queryKey: queryKeys.organizations.list() });
useQuery({ queryKey: queryKeys.organizations.detail(orgId) });
useQuery({ queryKey: queryKeys.organizations.stats(orgId) });
```

**Applications:**
```typescript
// Before
useQuery({ queryKey: ['applications', { status, jobId }] });
useQuery({ queryKey: ['application', applicationId] });

// After
useQuery({ queryKey: queryKeys.applications.list({ status, jobId }) });
useQuery({ queryKey: queryKeys.applications.detail(applicationId) });
```

**Jobs:**
```typescript
// Before
useQuery({ queryKey: ['jobs'] });
useQuery({ queryKey: ['job', jobId, 'analytics'] });

// After
useQuery({ queryKey: queryKeys.jobs.list() });
useQuery({ queryKey: queryKeys.jobs.analytics(jobId) });
```

#### Step 3: Update Cache Invalidation
```typescript
// Before
queryClient.invalidateQueries(['organizations']);
queryClient.invalidateQueries(['organization', orgId]);

// After
queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
```

### High-Priority Query Key Files

1. **Admin Components** (20 files):
   - `src/components/admin/OrganizationManagement.tsx`
   - `src/components/admin/UserManagementDialog.tsx`
   - `src/components/admin/SystemHealthMonitor.tsx`

2. **Dashboard Components** (15 files):
   - `src/components/dashboard/**/*.tsx`
   - `src/components/SpendChart.tsx`
   - `src/components/PlatformBreakdown.tsx`

3. **Application Management** (18 files):
   - `src/components/applications/**/*.tsx`
   - `src/hooks/useApplicationForm.tsx`

---

## 📊 Progress Tracking

### Completed ✅
- [x] Logger utility created
- [x] Query keys library created
- [x] DevTools production guard added
- [x] Migration documentation created

### Manual Steps Required ⚠️
- [ ] Update `tsconfig.json` (read-only file)
- [ ] Fix TypeScript errors after strict mode enabled (~100-200 errors)
- [ ] Replace 326 console statements with logger (105 files)
- [ ] Standardize 321 query keys (78 files)

### Estimated Effort
- **TypeScript Fixes**: 2-3 hours (after enabling strict mode)
- **Console Replacement**: 3-4 hours (semi-automated with find/replace)
- **Query Key Standardization**: 4-5 hours (requires testing)
- **Total**: 9-12 hours of developer time

---

## 🚀 Next Steps

1. **Immediate** (Do First):
   - Manually edit `tsconfig.json` to enable strict mode
   - Run `npm run build` to see TypeScript errors
   - Fix critical type errors in auth/security files

2. **High Priority** (Week 1):
   - Replace console statements in auth/security files
   - Replace console statements in error handling
   - Standardize query keys in admin components

3. **Medium Priority** (Week 2):
   - Replace console statements in platform integrations
   - Standardize query keys in dashboard/analytics
   - Add integration with error monitoring service (Sentry)

4. **Low Priority** (Week 3):
   - Clean up remaining console statements
   - Standardize remaining query keys
   - Performance testing with new logger

---

## 🔍 Testing After Migration

### Logger Testing
```typescript
// Verify logs only appear in development
logger.log('Test message', { data: 'sensitive' });
// Should appear in dev console, not in production

// Verify errors always log
logger.error('Test error', new Error('Test'));
// Should appear in all environments
```

### Query Key Testing
```typescript
// Verify cache invalidation works
queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
// Should refetch all organization queries

// Verify specific invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
// Should only refetch specific organization
```

### TypeScript Testing
```bash
# After enabling strict mode
npm run build
# Should show all type errors

# Fix errors incrementally
npm run type-check
```

---

## 📝 Notes

- **Backward Compatibility**: Old console statements will still work, migration can be gradual
- **Performance Impact**: Logger adds minimal overhead (~1ms per call)
- **Bundle Size**: Logger adds ~2KB gzipped
- **Query Keys**: No runtime impact, only improves cache consistency
- **TypeScript**: Strict mode catches bugs at compile time, no runtime impact
