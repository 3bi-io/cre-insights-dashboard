# Codebase Audit — Non-Functional APIs, Orphaned & Unused Resources

This is a **read-only audit**. No files will be changed unless you approve a follow-up cleanup plan.

---

## 1. Non-Functional / Broken Edge Function APIs

These edge functions exist in the codebase but are **missing the credentials/secrets required to actually run**, or are otherwise non-functional. They will throw 500-class errors if invoked.

### A. Job board integrations missing API credentials
| Function | Required secret(s) | Status |
|---|---|---|
| `adzuna-integration` | `ADZUNA_API_KEY`, `ADZUNA_APP_ID` | NOT SET |
| `ziprecruiter-integration` | `ZIPRECRUITER_API_KEY`, `ZIPRECRUITER_COMPANY_ID` | NOT SET |
| `ziprecruiter-webhook` | (depends on ZipRecruiter) | NOT SET |
| `indeed-integration` | `INDEED_CLIENT_ID`, `INDEED_CLIENT_SECRET` | NOT SET |
| `talroo-integration` | (only generic Supabase keys; integration logic exists but no Talroo API key) | partial |
| `driverreach-integration` | `DRIVERREACH_API_KEY` (referenced in UI) | NOT SET |
| `tenstreet-*` (8 functions) | Tenstreet credentials are stored per-client in DB, not a global secret — these may work for clients that have credentials, but no global default | conditional |
| `craigslist-integration` | `CRAIGSLIST_USERNAME/PASSWORD/ACCOUNT_ID` | SET (works) |

**Recommendation:** Either configure the missing API keys (Adzuna, ZipRecruiter, Indeed, DriverReach) or remove these functions and the corresponding UI surfaces (`/admin/job-boards`, `DriverReachIntegration` page, etc.).

### B. Functions in the directory but **not registered** in `supabase/config.toml`
These deploy independently but are not declared in config (no JWT/import-map config):
- `scheduling-reminders` *(newly created — needs config entry + cron job)*
- `syndication-push` *(scheduled via cron weekly, but missing config entry)*
- `update-elevenlabs-phones`
- `verify-twilio-creds`

### C. Function declared in config but **directory missing** (broken deploy)
- `ai-analytics-enhanced` — listed in `supabase/config.toml` but no source folder. Will fail to deploy.

### D. New but not yet wired
- **`scheduling-reminders`** — implemented but **the pg_cron schedule has not been created**. Will never run until you run the SQL in `docs/VOICE_AGENT_SCHEDULING_SETUP.md` §3.
- **`agent-scheduling`** new tools (`reschedule_callback`, `cancel_callback`, `get_my_callback`) are deployed but the corresponding ElevenLabs webhook tools are **not yet configured in the ElevenLabs dashboard**, so voice agents cannot trigger them.

---

## 2. Build-Breaking Issue (Active)

```
src/features/applications/components/KanbanCard.tsx(3,21):
  TS2307: Cannot find module '@dnd-kit/utilities'
```
- `package.json` includes `@dnd-kit/core` and `@dnd-kit/sortable` but **not `@dnd-kit/utilities`**.
- Affects: `KanbanCard.tsx`, `KanbanColumn.tsx`, `KanbanBoard.tsx` (Applications Kanban view).
- **Fix:** add `@dnd-kit/utilities` dependency, or remove the Kanban feature if unused.

---

## 3. Orphaned Pages

Pages that exist in `src/pages/` but are **not referenced** by `AppRoutes.tsx` or any other component:

| Page | Notes |
|---|---|
| `src/pages/Campaigns.tsx` | Replaced by `features/campaigns/pages/CampaignsPage`. Old page still on disk. |
| `src/features/analytics/pages/AIImpactDashboardPage.tsx` | Duplicate of `src/pages/AIImpactDashboard.tsx`; only one is routed. |
| `src/features/applications/pages/AdminApplicationsPage.tsx` | Never imported. |
| `src/features/dashboard/pages/IndexPage.tsx` | Never imported. |

---

## 4. Orphaned Components (45 total)

Components that exist but are **never imported anywhere outside themselves**. Top items:

**Admin/Dashboard (likely safe to delete):**
- `BudgetOverview.tsx`
- `PlatformBreakdown.tsx`
- `admin/AdminQuickActions.tsx`
- `admin/OrganizationGrowthChart.tsx`
- `admin/QuickActionsPanel.tsx`
- `admin/RecentActivityFeed.tsx`
- `admin/SystemHealthMonitor.tsx`
- `dashboard/DashboardOverview.tsx`
- `dashboard/organization/OrganizationJobManagement.tsx`

**Analytics & AI:**
- `ai/TruthContractMonitor.tsx`
- `analytics/AIAnalyticsDashboard.tsx`
- `analytics/FeedAnalyticsSection.tsx`

**Applications/CSV:**
- `applications/SecureApplicationView.tsx`
- `applications/SecurityDemoCard.tsx`
- `csv/CsvApplicationTransformer.tsx`

**Tenstreet (entire group unreferenced):**
- `tenstreet/BulkExport.tsx`, `BulkImport.tsx`, `BulkStatusUpdate.tsx`
- `tenstreet/CredentialsManagementTable.tsx`, `CredentialsStatsCards.tsx`
- `tenstreet/ExportDataDialog.tsx`, `SyncOperations.tsx`
- `tenstreet/TenstreetErrorBoundary.tsx`, `XchangeStatusWidget.tsx`

**Landing/Marketing:**
- `landing/TestimonialsSection.tsx`
- `landing/VoiceWorkflowIllustration.tsx`
- `features/landing/components/IndustryShowcaseModal.tsx`

**Settings/Misc:**
- `settings/AdministratorsSettingsTab.tsx`
- `settings/LanguageSelector.tsx`
- `optimized/MemoizedComponents.tsx`
- `shared/EmptyStateIllustration.tsx`
- `common/LoadingScreen.tsx`
- `charts/PieChart.tsx`
- `design-system/ResponseiveHelpers.tsx` *(also has typo in filename: "Responseive")*
- `platforms/EveryTruckJobPlatformActions.tsx`
- `features/admin/components/ATSReadinessIndicator.tsx`

**Unused shadcn/ui primitives (safe to remove if not planned):**
- `ui/aspect-ratio.tsx`
- `ui/carousel.tsx`
- `ui/hover-card.tsx`
- `ui/input-otp.tsx`
- `ui/mobile-scrollable-tabs.tsx`
- `ui/navigation-menu.tsx`
- `ui/radio-group.tsx`
- `ui/resizable.tsx`
- `ui/responsive-text.tsx`
- `ui/shimmer.tsx`

**Test stub:** `ui/__tests__/button.test.tsx` (no test runner configured in build).

---

## 5. Edge Functions With No Frontend or Cron Caller

These deploy fine, but **nothing in the project actively invokes them** (no `supabase.functions.invoke` calls, no cron jobs, no webhook configurations found in code):

- `update-elevenlabs-phones` — admin-only utility script; presumably manually invoked
- `verify-twilio-creds` — debug/setup utility
- `send-test-emails` — debug-only
- `test-sms` — debug-only
- `auth-email-templates` — replaced by Supabase native templates
- `generate-founders-pass-creative` — one-off marketing asset
- `backfill-webhook` — one-off backfill script

**Note:** Several apparent "orphans" (e.g. `hayes-*-inbound`, `tenstreet-webhook`, `whatsapp-webhook`, `meta-engagement-webhook`, `sms-webhook`, `cdl-jobcast-inbound`) are actually **valid external webhook receivers** — their URLs are configured in third-party dashboards (Tenstreet, Twilio, Meta, etc.), not in this codebase. They are functional, not orphans.

---

## 6. Documentation / Setup Gaps

- `docs/VOICE_AGENT_SCHEDULING_SETUP.md` instructs you to manually run a `cron.schedule(...)` SQL block to enable the new reminders system — **this has not been done**, so reminders won't fire.
- ElevenLabs voice agents need 3 new webhook tools registered (`reschedule_callback`, `cancel_callback`, `get_my_callback`) — not yet done in ElevenLabs UI.

---

## Suggested Next Step

If you'd like, I can prepare a follow-up cleanup plan that:
1. Fixes the build error (`@dnd-kit/utilities`) — or removes the Kanban feature entirely.
2. Deletes the orphaned page and component files (with your approval per group).
3. Removes broken integration functions (Adzuna/ZipRecruiter/Indeed/DriverReach) **or** wires up their secrets.
4. Removes `ai-analytics-enhanced` from `config.toml` and adds entries for `scheduling-reminders`, `syndication-push`, `update-elevenlabs-phones`, `verify-twilio-creds`.
5. Activates the `scheduling-reminders` cron job and provides ElevenLabs tool JSON to register the 3 new scheduling tools.

Just tell me which sections to act on and I'll generate the cleanup plan.
