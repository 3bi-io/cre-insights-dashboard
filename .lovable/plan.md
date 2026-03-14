

# Phase 3: Migrate OrganizationApplicationsTab + Remove Deprecated Hook

Continuing from the approved refactoring plan, this implements item #7 — the last short-term task.

---

## Changes

### 1. Update `OrganizationApplicationsTab.tsx`

Replace the deprecated `useApplications` import with the canonical hooks:

- **Import**: `usePaginatedApplications` + `useApplicationsMutations` instead of `useApplications`
- **Add**: `useMemo` import from React
- **Data fetching**: Use `usePaginatedApplications({ organizationId, search, status })` — filters map directly
- **Mutations**: Use `useApplicationsMutations()` for `updateApplication`
- **Flatten pages**: Add `useMemo` to flatten `data?.pages` into a flat array (same pattern used in `ApplicationsPage.tsx`)
- **Loading state**: Rename `isLoading` to `loading` via destructuring alias for minimal template changes

All UI rendering, helpers (`filterApplications`, `getStatusCounts`, `getCategoryCounts`), and PDF export remain unchanged.

### 2. Delete `src/features/applications/hooks/useApplications.tsx`

This was the only consumer. The file is a deprecated shim wrapping `usePaginatedApplications` + `useApplicationsMutations` — no unique logic.

### 3. Update `src/features/applications/hooks/index.ts`

Remove the two lines exporting `useApplications` and `ApplicationFilters` from the barrel file.

### 4. Update `.lovable/plan.md`

Mark #7 as completed.

---

## Risk

Low. The component's data shape doesn't change — `usePaginatedApplications` returns the same `applications` rows with the same joins. The `updateApplication` signature is identical in both hooks.

