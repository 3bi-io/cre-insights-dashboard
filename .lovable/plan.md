

# App-Wide Resource Optimization Plan

## Current State Assessment

The app has **90+ lazy-loaded routes** in `AppRoutes.tsx` which is good, but several significant resource waste patterns exist across the codebase.

---

## Optimization Areas

### 1. Static Imports in AppRoutes That Should Be Lazy

Five public pages are **statically imported** in `AppRoutes.tsx` (lines 7-11), meaning they are bundled into the initial chunk even if the user never visits them:

- `JobsPage`
- `PublicClientsPage`
- `FeaturesPage`
- `ContactPage`
- `ResourcesPage`

**Fix**: Convert these to `React.lazy()` like every other page. The memory note says "static imports to bypass suspense" but the `RouteWrapper` with `Suspense` is already in place and the skeleton fallback is fast enough.

### 2. ChatBot Eagerly Loaded in Layout

`Layout.tsx` line 8 statically imports `ChatBot` (MobileChatBot), which includes the ElevenLabs SDK and chat UI. This loads for **every authenticated page load** even for non-admin users who never see it.

**Fix**: Lazy-load ChatBot and only render it when the role check passes:
```tsx
const ChatBot = React.lazy(() => import('@/components/chat/MobileChatBot'));
```

### 3. Aggressive Polling — 12+ Queries at 10-30s Intervals

Multiple queries poll every 10-30 seconds regardless of whether the user is on the relevant page:

| Hook/Component | Interval | Page |
|---|---|---|
| `usePlatformData` | 30s | Platforms |
| `usePlatforms` | 30s | Multiple |
| `SpendChart` | 30s | Dashboard |
| `PlatformBreakdown` | 30s | Dashboard |
| `JobPerformanceTable` | 30s | Dashboard |
| `RecentActivityFeed` | 30s | Dashboard |
| `useSocialInteractions` | 30s | Social |
| `useElevenLabsConversations` | 30s | Voice |
| `useTenstreetNotifications` | 30s | ATS |
| `TenstreetSyncDashboard` | 10s | Sync |
| `DriverReachSyncDashboard` | 10s | Sync |
| `useFeedSyncStatus` | 60s | Feeds |

**Fix**: 
- Increase default polling to **60s** for non-critical data (platforms, spend, breakdown, activity)
- Use **visibility-aware polling** — only poll when the browser tab is active (`refetchIntervalInBackground: false` is already set in some, but not all)
- For sync dashboards (10s), use conditional polling that stops when no active operations exist (some already do this, standardize the pattern)
- Add `enabled` guards so queries only run when their component is mounted/visible

### 4. Duplicate Lazy Component Definitions

`src/components/optimized/LazyComponents.tsx` defines lazy versions of Dashboard, Applications, Platforms, Settings, Auth, Apply, etc. — but `AppRoutes.tsx` defines its **own** lazy imports for the same pages. The `LazyComponents.tsx` file appears unused.

**Fix**: Delete `LazyComponents.tsx` entirely (verify no imports first) to reduce dead code.

### 5. `useOptimizedQuery` Hook Has Stale Memoization

The `memoizedQueryFn` in `useOptimizedQuery.tsx` uses `useCallback(queryFn, [])` with an **empty dependency array**, meaning the query function never updates even if its closure variables change. This is a correctness bug that also causes stale data fetches.

**Fix**: Either remove the hook (let consumers use `useQuery` directly with proper options) or fix the dependency array to `[queryFn]`.

### 6. Route-Level Code Splitting for Feature Modules

Several feature modules (`@/features/candidate`, `@/features/applications`, etc.) are imported via `.then(m => ({ default: m.X }))` patterns. This means the **entire feature barrel export** is loaded to extract one component.

**Fix**: Use direct file path imports instead of barrel re-exports for lazy routes:
```tsx
// Before: loads entire feature module
React.lazy(() => import("@/features/candidate").then(m => ({ default: m.CandidateDashboard })))

// After: loads only the specific page
React.lazy(() => import("@/features/candidate/pages/CandidateDashboard"))
```

### 7. Dashboard Component Conditional Loading

`DashboardPage.tsx` imports `SuperAdminDashboard`, `RegularUserDashboard`, `DashboardLayout`, and `ClientPortalDashboard` statically — but only **one** renders per user role.

**Fix**: Lazy-load each dashboard variant so only the user's actual dashboard is fetched:
```tsx
const SuperAdminDashboard = React.lazy(() => import('../components/SuperAdminDashboard'));
const ClientPortalDashboard = React.lazy(() => import('../components/ClientPortalDashboard'));
// etc.
```

---

## Implementation Priority

1. **Polling intervals** (highest impact — reduces ongoing Supabase load by ~50%)
2. **Lazy-load ChatBot** in Layout (removes heavy SDK from non-admin bundles)
3. **Static → lazy** for 5 public pages in AppRoutes
4. **Direct path imports** for feature module lazy routes
5. **Dashboard role-based lazy loading**
6. **Fix/remove `useOptimizedQuery`** stale memoization
7. **Delete unused `LazyComponents.tsx`**

## Technical Notes
- All lazy conversions use existing `RouteWrapper`/`Suspense` infrastructure
- Polling changes are configuration-only (no new code patterns needed)
- Feature module splitting requires verifying each component's actual file path

