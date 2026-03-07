

## Public UI Refactoring Review

After reviewing all 18 public pages and the PublicLayout, here are the key findings and recommended refactoring organized by priority.

---

### Current State

The public pages are generally well-built with good SEO, accessibility, and mobile patterns. However, there are clear opportunities to reduce duplication, extract shared patterns, and improve maintainability.

---

### Priority 1: Extract Shared Page Patterns

**Problem**: Every page independently implements the same hero + filter bar + content + CTA footer pattern. ContactPage, BlogPage, ResourcesPage, and ClientsPage all have near-identical filter bar sections (tabs/search in a `border-b bg-muted/30` strip) and CTA footer sections (gradient background with centered heading + buttons).

**Refactoring**:
- **Create `PublicPageHero` component** — standardize the hero pattern used across 8+ pages (HeroBackground + badge + title + subtitle). Currently each page manually composes this with slightly different markup.
- **Create `FilterBar` component** — extract the tabs + search strip pattern shared by BlogPage, ClientsPage, and ResourcesPage into a single reusable component accepting `tabs`, `activeTab`, `onTabChange`, `searchValue`, `onSearchChange`.
- **Create `GradientCTA` component** — extract the repeated gradient CTA footer pattern (used in FeaturesPage, ClientsPage, and similar sections) into a shared component accepting `title`, `description`, `primaryAction`, `secondaryAction`.

**Files affected**: `ContactPage`, `BlogPage`, `ResourcesPage`, `ClientsPage`, `FeaturesPage`, `DemoPage`

---

### Priority 2: Consolidate Voice Application Wiring

**Problem**: `JobsPage.tsx` (250 lines) and `JobDetailsPage.tsx` (408 lines) both independently destructure 12+ props from `useElevenLabsVoice()` and wire them into `VoiceApplicationPanel`. This is duplicated boilerplate.

**Refactoring**:
- **Create `VoiceApplicationContainer` component** that internally calls `useElevenLabsVoice()` and renders `VoiceApplicationPanel` with all props wired. The parent pages only need to pass a `startVoiceApplication` callback up (via context or render prop).
- Alternatively, create a `useVoiceApplicationProps()` hook that returns a single spread object for `VoiceApplicationPanel`.

**Files affected**: `JobsPage.tsx`, `JobDetailsPage.tsx`, `src/features/jobs/pages/JobsPage.tsx` (admin)

---

### Priority 3: Move Inline Filter Chips to a Shared Component

**Problem**: `JobsPage.tsx` has 30+ lines of inline filter chip rendering (lines 155-188) with Badge + X button + clear all. This pattern is reusable.

**Refactoring**:
- **Create `ActiveFilterChips` component** accepting an array of `{ label, value, onClear }` and a `clearAll` callback.

**Files affected**: `JobsPage.tsx`, potentially `ClientsPage`, `BlogPage`

---

### Priority 4: Reduce JobDetailsPage Size

**Problem**: `JobDetailsPage.tsx` at 408 lines is the largest public page. It mixes concerns: sharing logic, salary formatting, schema building, and complex UI layout all in one file.

**Refactoring**:
- **Extract `JobShareActions` component** — the share button row (LinkedIn, X, copy link, native share) with associated handlers is ~50 lines of logic + UI.
- **Extract `JobSidebar` component** — the sticky sidebar card (apply CTA, company logo, salary badge, share card) is ~70 lines.
- **Move `formatSalary` to a utility** — it's a pure function that belongs in `utils/jobDisplayUtils.ts`.

**Files affected**: `JobDetailsPage.tsx`

---

### Priority 5: Standardize Structured Data Construction

**Problem**: Multiple pages build schema objects inline (ContactPage builds 3 schemas inline, FeaturesPage builds 2, etc.). Some pages use `buildBreadcrumbSchema` inconsistently — some pass `href` keys, others pass `url` keys.

**Refactoring**:
- **Standardize `buildBreadcrumbSchema` calls** — the function accepts both `href` and `url` but pages use them inconsistently. Pick one.
- **Extract page-specific schemas into dedicated functions** — e.g., `buildContactPageSchema()`, `buildSoftwareAppSchema()`. Keep pages focused on rendering.

**Files affected**: All public pages

---

### Priority 6: DemoPage Decomposition

**Problem**: `DemoPage.tsx` is 564 lines — the largest public file. It contains 4 tab sections (Voice, Kanban, Platform, Flow), each with substantial markup and static data arrays.

**Refactoring**:
- **Split each tab into its own component**: `VoiceDemoTab`, `KanbanDemoTab`, `PlatformDemoTab`, `FlowDemoTab`.
- **Move static data** (featureCards, platformFeatures, applicationSteps, comparisonData) to a `demoContent.ts` file.

**Files affected**: `DemoPage.tsx`

---

### Priority 7: SitemapPage Data Extraction

**Problem**: `SitemapPage.tsx` has ~140 lines of static route data hardcoded inline. This data should live in a separate config file and ideally be auto-generated from route definitions.

**Refactoring**:
- **Move route categories to `sitemapData.ts`** config file.
- Long term: auto-generate from `AppRoutes.tsx` route config.

**Files affected**: `SitemapPage.tsx`

---

### Summary of New Shared Components

| Component | Replaces | Used By |
|-----------|----------|---------|
| `PublicPageHero` | Repeated hero markup | 8+ pages |
| `FilterBar` | Tabs + search strip | Blog, Clients, Resources |
| `GradientCTA` | Gradient footer CTA | Features, Clients, Demo |
| `ActiveFilterChips` | Inline filter badges | Jobs, potentially others |
| `VoiceApplicationContainer` | Voice hook wiring | JobsPage, JobDetailsPage |
| `JobShareActions` | Share button logic | JobDetailsPage |
| `JobSidebar` | Sticky sidebar card | JobDetailsPage |

### Estimated Impact

- ~400 lines of duplicated code eliminated
- DemoPage reduced from 564 to ~150 lines
- JobDetailsPage reduced from 408 to ~200 lines
- Consistent visual patterns across all public pages
- Easier maintenance when updating shared patterns (hero, CTA, filters)

