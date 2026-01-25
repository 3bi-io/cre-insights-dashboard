
# Global Data Loading Handler with Empty State

## Overview

Create a unified system for handling data loading failures across all screens. This will provide consistent user feedback when data cannot be loaded, ensuring screens gracefully degrade to informative empty states rather than showing errors or blank content.

## Current State

The codebase already has several related components:
- `EmptyStateMessage` - shared component for "no data" feedback
- `EmptyStateIllustration` - themed empty states with illustrations
- `ErrorBoundary` - catches JavaScript errors (crashes)
- `GlobalErrorBoundary` - app-level error catching

However, there's no unified pattern for:
1. Handling React Query fetch failures consistently
2. Combining "error" and "no data" states into a single handler
3. Showing toast notifications when data loading fails
4. Providing a reusable hook/component for all data-fetching pages

## Solution

Create two new utilities:

### 1. `useDataLoadingState` Hook
A custom hook that wraps React Query state and provides:
- Unified loading/error/empty state detection
- Automatic toast notifications on fetch failures
- Retry functionality
- Empty state context (what type of data is missing)

### 2. `DataLoadingStateHandler` Component
A wrapper component that renders:
- Loading skeleton when fetching
- Error state with retry when fetch fails
- Empty state when data is empty/null
- Children when data is available

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useDataLoadingState.ts` | Hook for unified data loading state management |
| `src/components/shared/DataLoadingStateHandler.tsx` | Component wrapper for consistent UI handling |

## Files to Update

| File | Change |
|------|---------|
| `src/hooks/index.ts` | Export new hook |
| `src/components/shared/index.ts` | Export new component |

## Implementation Details

### `useDataLoadingState` Hook

```typescript
interface UseDataLoadingStateOptions<T> {
  data: T | undefined | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  refetch?: () => void;
  emptyCheck?: (data: T) => boolean; // Custom empty check (e.g., array.length === 0)
  dataLabel?: string; // e.g., "campaigns", "applications"
  showErrorToast?: boolean; // Default: true
}

interface DataLoadingState<T> {
  state: 'loading' | 'error' | 'empty' | 'success';
  data: T | null;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  retry: () => void;
  errorMessage: string;
}
```

**Behavior**:
- When `isError` becomes true, automatically shows a toast: "Failed to load {dataLabel}. Please try again."
- Determines `isEmpty` based on provided `emptyCheck` or sensible defaults (null, undefined, empty array, empty object)
- Provides a unified `state` enum for simpler conditional rendering

### `DataLoadingStateHandler` Component

```typescript
interface DataLoadingStateHandlerProps<T> {
  // Query state
  data: T | undefined | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  refetch?: () => void;
  
  // Empty state customization
  emptyCheck?: (data: T) => boolean;
  emptyStateType?: EmptyStateType; // 'no-jobs', 'no-applications', etc.
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void } | { label: string; href: string };
  
  // Loading customization
  loadingComponent?: React.ReactNode;
  loadingMessage?: string;
  
  // Error customization
  showErrorToast?: boolean;
  errorTitle?: string;
  
  // Data label for messages
  dataLabel?: string;
  
  // Content when data is available
  children: (data: T) => React.ReactNode;
}
```

**Rendering Logic**:
1. If `isLoading` → Show loading skeleton or custom loader
2. If `isError` → Show error alert with retry button
3. If empty (based on `emptyCheck`) → Show `EmptyStateIllustration`
4. Otherwise → Render `children(data)`

## Usage Example

**Before** (current pattern in CampaignsPage):
```tsx
{isError && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>Failed to load campaigns...</AlertDescription>
  </Alert>
)}

{isLoading && (
  <div className="flex justify-center items-center py-12">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
)}

{!isLoading && !isError && (
  <>
    {campaigns.length === 0 ? (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3>No campaigns yet</h3>
          <p>Create your first campaign...</p>
        </CardContent>
      </Card>
    ) : (
      campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)
    )}
  </>
)}
```

**After** (with new component):
```tsx
<DataLoadingStateHandler
  data={campaigns}
  isLoading={isLoading}
  isError={isError}
  refetch={refetch}
  dataLabel="campaigns"
  emptyStateType="no-jobs"
  emptyTitle="No campaigns yet"
  emptyDescription="Create your first campaign to get started"
  emptyAction={{ label: 'Create Campaign', onClick: () => setShowCreateDialog(true) }}
>
  {(data) => data.map(c => <CampaignCard key={c.id} campaign={c} />)}
</DataLoadingStateHandler>
```

## Technical Considerations

1. **Toast Deduplication**: Use a ref to track if an error toast has been shown to prevent duplicates on re-renders
2. **Custom Empty Checks**: Support arrays (`.length === 0`), objects (`Object.keys().length === 0`), and custom predicates
3. **Skeleton Variants**: Allow passing custom loading components for feature-specific skeletons
4. **Accessibility**: Include proper ARIA labels for loading/error states
5. **Type Safety**: Full TypeScript generics support for data type inference

## Benefits

- **Consistency**: All screens handle data loading failures the same way
- **Less Boilerplate**: Pages no longer need to repeat loading/error/empty conditional logic
- **User Feedback**: Automatic toast notifications when data fails to load
- **Graceful Degradation**: Screens never show blank content - always informative states
- **Maintainability**: Single source of truth for data loading UI patterns
