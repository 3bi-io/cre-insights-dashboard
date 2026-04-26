## Cleanup Plan

Acting on your audit directives: remove the broken integrations and orphan files, fix the build error, sync `supabase/config.toml`, activate the new scheduling cron, and provide ElevenLabs tool JSON.

---

### 1. Fix the build error

- Add `@dnd-kit/utilities` to `package.json` (used by `KanbanCard.tsx`, `KanbanColumn.tsx`).

### 2. Remove broken job-board integrations

Delete edge functions (and call `delete_edge_functions` to remove deployed copies):
- `adzuna-integration`
- `ziprecruiter-integration`
- `ziprecruiter-webhook`
- `indeed-integration`
- `driverreach-integration`
- `talroo-integration`

Delete dedicated frontend surfaces tied 1:1 to those integrations:
- `src/pages/DriverReachIntegration.tsx`
- `src/pages/DriverReachSyncDashboard.tsx`
- `src/components/platforms/AdzunaPlatformActions.tsx`
- `src/components/platforms/ZipRecruiterPlatformActions.tsx`
- `src/components/platforms/TalrooPlatformActions.tsx`
- `src/features/platforms/services/adzunaService.ts`
- `src/features/platforms/services/indeedService.ts` (only the integration-call portion; keep XML feed types)
- `src/components/tracking/ZipRecruiterPixel.tsx`, `ClientZipRecruiterPixels.tsx`, `ChurchZipRecruiterPixel.tsx`

Update routing/wiring:
- Remove DriverReach routes from `src/components/routing/AppRoutes.tsx`.
- Remove the deleted lazy imports + switch cases from `src/components/platforms/PlatformActionPanel.tsx`.
- Remove deleted exports from `src/features/platforms/components/index.ts`.
- Remove DriverReach/Adzuna/ZipRecruiter/Talroo entries from `src/components/CommandPalette.tsx`, `src/config/navigationConfig.ts`, `src/components/common/Header.tsx` only where they link to deleted pages.

**Deferred (NOT removed) — these reference the platform names but are generic plumbing**: `Platforms.tsx`, `JobBoards.tsx`, `platformConfigs.ts`, `organizationPlatforms.config.ts`, demo content, landing content, dataQuality, `applicationFormatters`, `ATS stageConfig`, `RecentApplicantsTable`, `FilterDialog`, `JobGroupDialog`. These keep working as multi-platform views even after the dedicated integrations are gone — they just stop showing those specific platforms as "connected."

If you want a deeper purge of those, say so and I'll do a second pass.

### 3. Sync `supabase/config.toml`

- Remove entries for deleted functions (`adzuna-integration`, `ziprecruiter-integration`, `ziprecruiter-webhook`, `indeed-integration`, `driverreach-integration`, `talroo-integration`, `ai-analytics-enhanced`).
- Add missing entries: `scheduling-reminders`, `syndication-push`, `update-elevenlabs-phones`, `verify-twilio-creds` (all `verify_jwt = true`, except `scheduling-reminders` which is cron-invoked → `verify_jwt = false`).

### 4. Remove orphan pages (4)

- `src/pages/Campaigns.tsx`
- `src/features/analytics/pages/AIImpactDashboardPage.tsx`
- `src/features/applications/pages/AdminApplicationsPage.tsx`
- `src/features/dashboard/pages/IndexPage.tsx`

### 5. Remove orphan components (45)

Delete the full list from the audit:

- **Admin/Dashboard:** `BudgetOverview.tsx`, `PlatformBreakdown.tsx`, `admin/AdminQuickActions.tsx`, `admin/OrganizationGrowthChart.tsx`, `admin/QuickActionsPanel.tsx`, `admin/RecentActivityFeed.tsx`, `admin/SystemHealthMonitor.tsx`, `dashboard/DashboardOverview.tsx`, `dashboard/organization/OrganizationJobManagement.tsx`
- **Analytics & AI:** `ai/TruthContractMonitor.tsx`, `analytics/AIAnalyticsDashboard.tsx`, `analytics/FeedAnalyticsSection.tsx`
- **Applications/CSV:** `applications/SecureApplicationView.tsx`, `applications/SecurityDemoCard.tsx`, `csv/CsvApplicationTransformer.tsx`
- **Tenstreet UI cluster:** `tenstreet/BulkExport.tsx`, `BulkImport.tsx`, `BulkStatusUpdate.tsx`, `CredentialsManagementTable.tsx`, `CredentialsStatsCards.tsx`, `ExportDataDialog.tsx`, `SyncOperations.tsx`, `TenstreetErrorBoundary.tsx`, `XchangeStatusWidget.tsx`
- **Landing/Marketing:** `landing/TestimonialsSection.tsx`, `landing/VoiceWorkflowIllustration.tsx`, `features/landing/components/IndustryShowcaseModal.tsx`
- **Settings/Misc:** `settings/AdministratorsSettingsTab.tsx`, `settings/LanguageSelector.tsx`, `optimized/MemoizedComponents.tsx`, `shared/EmptyStateIllustration.tsx`, `common/LoadingScreen.tsx`, `charts/PieChart.tsx`, `design-system/ResponseiveHelpers.tsx`, `platforms/EveryTruckJobPlatformActions.tsx`, `features/admin/components/ATSReadinessIndicator.tsx`
- **Unused shadcn primitives (9):** `aspect-ratio`, `carousel`, `hover-card`, `input-otp`, `mobile-scrollable-tabs`, `navigation-menu`, `radio-group`, `resizable`, `responsive-text`, `shimmer`

Each will be re-verified as unreferenced before deletion; any with stragglers get noted, not silently broken.

### 6. Stale admin/debug edge functions — keep but document

Per your "fix as needed" — these stay deployed (no code changes), and we add their entries to `config.toml` so they're declared:
- `update-elevenlabs-phones`, `verify-twilio-creds` (added in step 3)
- `send-test-emails`, `test-sms`, `auth-email-templates`, `generate-founders-pass-creative`, `backfill-webhook` — already in `config.toml`, leaving as-is.

### 7. Activate the new scheduling reminders

- Run the `cron.schedule(...)` SQL via the database insert tool to register `scheduling-reminders` to fire every minute.

### 8. ElevenLabs tool registration (manual — you do this)

Provide ready-to-paste JSON schemas for the 3 new webhook tools (`reschedule_callback`, `cancel_callback`, `get_my_callback`) pointed at the `agent-scheduling` function — output to chat after the code changes land.

---

### Out of scope / not touching

- Tenstreet **edge functions and hooks** (functional, in active use by ATSCommandCenterPage and TenstreetIntegration page) — only the unused UI components in `src/components/tenstreet/` are removed.
- The deprecated re-export shim hooks (`useBulkOperations.tsx`, etc.) — they still have callers via the feature barrel.
- Generic platform plumbing (`Platforms.tsx`, `JobBoards.tsx`, etc.) — see note in §2.

### Risk / verification

After deletions I'll run a build check (`tsc --noEmit`) to catch any missed imports and patch them before finishing.
