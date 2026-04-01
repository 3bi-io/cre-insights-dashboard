

## Plan: Attribution-Aware Application Views

### Problem
The application views are blind to the attribution data we now capture. The `source` field shows raw internal codes (e.g. `hayes-re-garrison-inbound`), UTM fields (`utm_source`, `utm_medium`, `utm_campaign`) are never displayed, `referral_source` and `how_did_you_hear` are invisible, and the source filter dropdown is hardcoded with stale values that don't match actual data.

### Changes

#### 1. Update Application type (`src/types/common.types.ts`)
Add missing fields to the `Application` interface:
- `utm_source?: string`
- `utm_medium?: string`  
- `utm_campaign?: string`
- `raw_payload?: Record<string, unknown>`
- `ats_readiness_score?: number`
- `first_response_at?: string`

#### 2. Add source display helper (`src/features/applications/utils/applicationFormatters.ts`)
Add a `getSourceDisplay(app)` function that returns a human-readable source label and icon hint by normalizing raw source values:
- `hayes-re-garrison-inbound` → "Inbound (R.E. Garrison)"
- `Direct Application` → "Direct"
- `zapier` → "Zapier"
- Falls back to `utm_source` if source is generic, then raw `source` value.

Add `getAttributionSummary(app)` that returns a structured object with: source label, utm_source, utm_medium, utm_campaign, referral_source, how_did_you_hear — for use in detail views.

#### 3. Add Source column to `ApplicationsTableView`
- Add `source` to `ColumnVisibility` interface and `TableColumnVisibility` dropdown
- Render a new "Source" column between Date and Status showing `getSourceDisplay()` output as a compact badge, with `utm_source` as a tooltip

#### 4. Add Source badge to `ApplicationCard`
- Below the date row, add a source badge using `getSourceDisplay()` — similar to how KanbanCard already does it but with the human-readable label

#### 5. Add Attribution section to `ApplicationDetailsDialog`
- New collapsible "Source & Attribution" section (between Job Information and Application Details) showing:
  - Source (formatted)
  - UTM Source / Medium / Campaign (when present)
  - Referral Source / How Did You Hear (when present)
  - Raw Payload viewer (collapsible JSON pre block, admin-only)

#### 6. Fix source filter values (`ApplicationsFilters.tsx`)
- Replace hardcoded source options with dynamic values derived from the actual applications data
- Accept a `sourceOptions` prop (string array) computed by the parent from loaded data
- Fall back to current hardcoded list if no options provided

#### 7. Fix category filter codes
The filter uses `A`, `B`, `C` but `getApplicantCategory` returns `D`, `SC`, `SR`, `N/A`. Fix to match actual codes and labels.

### Files changed (7)
- `src/types/common.types.ts` — add utm/attribution fields
- `src/features/applications/utils/applicationFormatters.ts` — add `getSourceDisplay`, `getAttributionSummary`
- `src/features/applications/components/TableColumnVisibility.tsx` — add `source` column toggle
- `src/features/applications/components/ApplicationsTableView.tsx` — add Source column
- `src/components/applications/ApplicationCard.tsx` — add source badge
- `src/components/applications/ApplicationDetailsDialog.tsx` — add Attribution section + raw payload viewer
- `src/features/applications/components/ApplicationsFilters.tsx` — dynamic source options + fix category codes

