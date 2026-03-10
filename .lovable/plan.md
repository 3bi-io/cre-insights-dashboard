

## Centralized Benefits Data Source — Implementation Plan

### Problem
Benefits data is scattered across 5+ locations with hardcoded, inconsistent values:
- **Ad Creative Studio** — 12 benefit options in `socialBeacons.config.ts`
- **Social auto-responses** — hardcoded "medical, dental, 401k" strings in `engagement-responder.ts`
- **Intent classifiers** — keyword lists in `engagement-classifier.ts` and `social-ai-service.ts`
- **Landing page** — marketing copy in `benefits.content.ts`
- **Job listings** — free-text `benefits` field in DB, no structured data

No database table for benefits exists. The voice agent, social responder, and ad studio all operate on different hardcoded lists with no connection to actual job-level benefits.

### Plan

#### 1. Create `benefits_catalog` database table

A reference table of all possible benefit types, usable across the entire platform:

```sql
CREATE TABLE public.benefits_catalog (
  id text PRIMARY KEY,              -- e.g. 'sign_on_bonus', 'health_insurance'
  label text NOT NULL,              -- Display label: '$5k Sign-on Bonus'
  category text NOT NULL,           -- 'compensation', 'insurance', 'lifestyle', 'retirement'
  icon text NOT NULL DEFAULT 'Shield', -- Lucide icon name
  keywords text[] NOT NULL DEFAULT '{}', -- For classifier matching: ['sign on', 'signing bonus']
  social_copy jsonb DEFAULT '{}',   -- Platform-specific response snippets
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

Seed with the existing 12 benefits from `BENEFIT_OPTIONS` plus additional ones from the responder (medical, dental, vision, 401k, PTO individually).

#### 2. Create `job_listing_benefits` junction table

Link structured benefits to job listings:

```sql
CREATE TABLE public.job_listing_benefits (
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE,
  benefit_id text REFERENCES benefits_catalog(id) ON DELETE CASCADE,
  custom_value text,  -- e.g. '$7k' for sign_on_bonus
  PRIMARY KEY (job_id, benefit_id)
);
```

#### 3. Create shared benefits config module

**New file: `src/config/benefits.config.ts`**

- Export a `useBenefitsCatalog()` hook that fetches from `benefits_catalog` table (cached via React Query)
- Export static fallback matching current `BENEFIT_OPTIONS` for offline/SSR
- Re-export types (`BenefitId`, `BenefitItem`)

#### 4. Update consumers to use centralized source

| Consumer | Change |
|----------|--------|
| `socialBeacons.config.ts` | Remove `BENEFIT_OPTIONS`, re-export from `benefits.config.ts` |
| `AdCreativeStudio.tsx` | Import from `benefits.config.ts` instead |
| `BenefitToggle.tsx` | No change (already generic) |
| `engagement-responder.ts` | Look up `social_copy` from benefits catalog (edge function queries DB) |
| `engagement-classifier.ts` | Pull `keywords` arrays from catalog instead of hardcoded lists |
| `social-ai-service.ts` | Same keyword update |
| Landing page `benefits.content.ts` | No change (marketing copy is intentionally different) |

#### 5. Wire benefits to voice agent context

Update `useVoiceAgentConnection.ts` to pass the job's structured benefits as a dynamic variable so the agent can answer benefits questions accurately per-job instead of using generic responses.

### Technical Details

- **RLS**: `benefits_catalog` is public-read, admin-write. `job_listing_benefits` follows `job_listings` RLS.
- **Edge function access**: The shared edge functions query `benefits_catalog` using the service role key (already available).
- **Migration**: Seed data maps 1:1 from current `BENEFIT_OPTIONS` plus expanded entries for individual insurance types, PTO, 401k.
- **Backward compatibility**: The existing free-text `benefits` column on `job_listings` remains unchanged; the new junction table is additive.

### Files to create/modify
1. **New migration** — `benefits_catalog` + `job_listing_benefits` tables + seed data + RLS
2. **New** `src/config/benefits.config.ts` — shared hook + types + fallback
3. **Edit** `src/features/social-engagement/config/socialBeacons.config.ts` — remove `BENEFIT_OPTIONS`, re-export
4. **Edit** `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` — update import
5. **Edit** `supabase/functions/_shared/engagement-responder.ts` — query DB for social copy
6. **Edit** `supabase/functions/_shared/engagement-classifier.ts` — query DB for keywords
7. **Edit** `supabase/functions/_shared/social-ai-service.ts` — query DB for keywords
8. **Edit** `src/features/elevenlabs/hooks/useVoiceAgentConnection.ts` — pass job benefits as dynamic variable

