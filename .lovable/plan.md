

# Fix: Search Input Loses Focus After Each Keystroke

## Root Cause

In `src/features/applications/hooks/useApplicationsFilters.ts`, the `useEffect` (lines 33-44) syncs **all** filter state to URL search params via `setSearchParams()`. Every character typed into the search box updates `filters.searchTerm`, which triggers this effect, which calls `setSearchParams()`, which causes React Router to re-render the route — causing the input to lose focus.

## Fix

**Debounce the URL sync** so `setSearchParams` is not called on every keystroke. Only sync to the URL after the user stops typing for 300ms.

### File: `src/features/applications/hooks/useApplicationsFilters.ts`

1. Import `useRef` and add a debounce timer ref
2. Replace the `useEffect` that syncs to URL with a debounced version using `setTimeout`/`clearTimeout` (300ms delay)
3. Keep all other filter changes (status, category, source, org) syncing immediately — only the search term needs debouncing

```typescript
// Replace the useEffect (lines 33-44) with:
useEffect(() => {
  const handler = setTimeout(() => {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
    if (filters.categoryFilter !== 'all') params.set('category', filters.categoryFilter);
    if (filters.sourceFilter !== 'all') params.set('source', filters.sourceFilter);
    if (filters.organizationFilter !== 'all') params.set('org', filters.organizationFilter);
    if (filters.clientFilter !== 'all') params.set('client', filters.clientFilter);
    setSearchParams(params, { replace: true });
  }, 300);

  return () => clearTimeout(handler);
}, [filters, setSearchParams]);
```

This is a single-file, single-line-range change. No other files need modification.

### Result
Users can type continuously in the search input without losing focus. The URL still updates to reflect the search term, but only after a 300ms pause in typing.

