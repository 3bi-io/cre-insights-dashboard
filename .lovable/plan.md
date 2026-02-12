

# Client Analytics Dashboard -- Best-in-Class Implementation

## Vision

Replace the existing lightweight `ClientsOverviewDashboard` (currently a tab in the main dashboard showing basic job/app counts) with a comprehensive, drill-down Client Analytics experience. The goal: give organization admins a single view to understand **which clients are performing, where the pipeline is healthy, where it's broken, and what needs attention** -- all backed by real data already in the database.

---

## Current State

- **ClientsOverviewDashboard**: Summary cards (total clients, jobs, applications) + a grid/table of clients with job count, app count, recent 30-day apps, and avg apps/job.
- **useClientMetrics hook**: Fetches clients with nested job_listings and applications. No ATS delivery data, no source breakdown, no SLA tracking, no readiness scores, no trend analysis.
- **Data available but unused**: `ats_sync_logs` (delivery status per application), `source_cost_config` (ROI), `first_response_at` (recruiter SLA), `ats_readiness_score`, `enrichment_status`, application `source`, application `status` pipeline stages.

---

## Proposed Architecture

### 1. Client Analytics Page (new dedicated page)

A new route `/clients/:clientId/analytics` accessible from the clients table, plus an enhanced inline dashboard tab.

### 2. Three-Tier Layout

**Tier 1 -- Portfolio Summary (top-level dashboard tab, replaces current)**
- KPI cards with trend sparklines: Total Applications, ATS Delivery Rate, Avg Readiness Score, Avg Response Time (SLA), Active Jobs
- Client leaderboard table with sortable columns and inline sparklines
- Filter bar: date range selector (7d/30d/90d/All), status filter, source filter

**Tier 2 -- Client Detail Drawer/Page (click into a client)**
- Client header with logo, name, location, ATS connection status badge
- Pipeline funnel: Applied -> Reviewed -> Interviewed -> Hired (status breakdown)
- Source mix donut chart (ElevenLabs Voice, Direct, ZipRecruiter, Indeed, etc.)
- ATS delivery waterfall: Total Apps -> Eligible -> Sent -> Accepted -> Failed
- Recruiter SLA timeline: time-to-first-contact distribution
- Application volume trend line (daily/weekly)
- ATS Readiness score distribution histogram

**Tier 3 -- Comparative View**
- Side-by-side client comparison (select 2-3 clients)
- Normalized metrics: apps per job, delivery success rate, avg readiness, response time
- Radar chart for multi-dimensional comparison

---

## Technical Plan

### New Files

| File | Purpose |
|------|---------|
| `src/features/clients/hooks/useClientAnalytics.ts` | Core data hook -- fetches applications, ats_sync_logs, and job_listings for a client with date range filtering. Computes pipeline stages, source breakdown, delivery stats, SLA metrics, readiness distribution, and daily trends. |
| `src/features/clients/hooks/useClientPortfolioAnalytics.ts` | Portfolio-level hook -- aggregates metrics across all clients for the summary view. Includes per-client sparkline data and leaderboard ranking. |
| `src/features/clients/types/clientAnalytics.types.ts` | TypeScript interfaces for all analytics data shapes. |
| `src/features/clients/components/analytics/ClientAnalyticsSummary.tsx` | Top-level KPI cards with trend indicators and sparklines. |
| `src/features/clients/components/analytics/ClientLeaderboard.tsx` | Sortable table ranking clients by configurable metric (apps, delivery rate, SLA). |
| `src/features/clients/components/analytics/ClientPipelineFunnel.tsx` | Horizontal funnel chart showing application status progression for a single client. |
| `src/features/clients/components/analytics/ClientSourceBreakdown.tsx` | Donut/pie chart of application sources. |
| `src/features/clients/components/analytics/ClientATSDeliveryStatus.tsx` | Stacked bar or waterfall showing ATS sync outcomes (success, error, pending). |
| `src/features/clients/components/analytics/ClientSLAMetrics.tsx` | Time-to-first-contact distribution and SLA compliance indicator. |
| `src/features/clients/components/analytics/ClientTrendChart.tsx` | Line chart of daily application volume with optional overlays (deliveries, sources). |
| `src/features/clients/components/analytics/ClientComparison.tsx` | Multi-client radar chart comparison view. |
| `src/features/clients/components/analytics/ClientAnalyticsDateFilter.tsx` | Shared date range selector component. |
| `src/features/clients/components/analytics/index.ts` | Barrel export. |
| `src/features/clients/components/ClientAnalyticsDashboard.tsx` | Main orchestrator replacing `ClientsOverviewDashboard` -- contains summary + leaderboard + drill-down drawer. |
| `src/features/clients/pages/ClientAnalyticsDetailPage.tsx` | Full-page detail view for a single client (optional route). |

### Modified Files

| File | Change |
|------|--------|
| `src/features/clients/hooks/useClientMetrics.ts` | Extend query to include ATS delivery counts, avg readiness score, avg SLA time, and source breakdown per client. |
| `src/features/clients/components/index.ts` | Export new analytics components. |
| `src/features/dashboard/config/dashboardConfig.tsx` | Replace `ClientsOverviewDashboard` import with new `ClientAnalyticsDashboard`. |
| `src/features/clients/components/ClientsTable.tsx` | Add "View Analytics" action button per client row that opens the detail drawer. |

### Data Flow

```text
Supabase Tables                      Hooks                          Components
-----------------                    -----                          ----------
clients                  -->  useClientPortfolioAnalytics  -->  ClientAnalyticsSummary
job_listings (client_id) -->         |                     -->  ClientLeaderboard
applications             -->         |
ats_sync_logs            -->  useClientAnalytics(clientId) -->  ClientPipelineFunnel
source_cost_config       -->         |                     -->  ClientSourceBreakdown
                                     |                     -->  ClientATSDeliveryStatus
                                     |                     -->  ClientSLAMetrics
                                     |                     -->  ClientTrendChart
```

### Key Queries (inside hooks)

1. **Portfolio summary**: Single query joining `clients -> job_listings -> applications` with LEFT JOIN to `ats_sync_logs`, grouped by `client_id`. Aggregates: app count, delivery success/fail count, avg readiness, avg SLA hours, source counts.

2. **Client detail**: Filtered by `client_id` + date range. Fetches applications with status, source, readiness_score, first_response_at, applied_at. Separate query for ats_sync_logs with join to applications for that client.

3. **Trend data**: Group by `DATE(applied_at)` for daily counts, computed client-side from the application array.

### UI/UX Details

- All charts use `recharts` (already installed)
- Date range filter persisted in URL search params
- Client detail opens as a Sheet/Drawer (using `vaul` already installed) for quick access, with option to expand to full page
- Loading states use existing `Skeleton` components
- Empty states use existing `EmptyStateMessage` shared component
- Mobile responsive: cards stack, charts resize, leaderboard scrolls horizontally
- Color-coded status badges consistent with existing application status colors

### No Database Changes Required

All data needed already exists in `applications`, `ats_sync_logs`, `job_listings`, `clients`, and `source_cost_config`. No migrations needed.

---

## Implementation Order

1. Types file (`clientAnalytics.types.ts`)
2. Portfolio analytics hook (`useClientPortfolioAnalytics.ts`)
3. Client detail analytics hook (`useClientAnalytics.ts`)
4. Summary and leaderboard components
5. Detail drill-down components (funnel, source, ATS, SLA, trend)
6. Main dashboard orchestrator (`ClientAnalyticsDashboard.tsx`)
7. Wire into dashboard config to replace existing tab
8. Add comparison view
9. Polish loading/empty states and mobile responsiveness

