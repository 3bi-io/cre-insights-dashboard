

# Centralized Benefits Data Source — IMPLEMENTED

## What was done

### 1. Database (`benefits_catalog` + `job_listing_benefits`)
- Created `benefits_catalog` table with 16 seeded benefits (compensation, insurance, lifestyle, operations, retirement categories)
- Each entry has: id, label, category, icon, keywords (for classifier), social_copy (per-platform response snippets)
- Created `job_listing_benefits` junction table linking structured benefits to job listings
- RLS: public-read for catalog, super-admin write; junction table follows job_listings access

### 2. Shared Config (`src/config/benefits.config.ts`)
- `useBenefitsCatalog()` hook — fetches from DB with React Query, 10min cache, static fallback
- `useJobBenefits(jobId)` hook — fetches structured benefits for a specific job listing
- `benefitsToVoiceContext()` — converts benefit items to readable string for voice agents
- `BENEFIT_OPTIONS` — backward-compatible re-export for Ad Creative Studio
- `BENEFITS_FALLBACK` — static array matching seed data

### 3. Frontend Consumers Updated
- `socialBeacons.config.ts` — removed hardcoded `BENEFIT_OPTIONS`, re-exports from centralized config
- `AdCreativeStudio.tsx` — imports from `@/config/benefits.config` instead

### 4. Edge Function Consumers Updated
- New `supabase/functions/_shared/benefits-catalog.ts` — shared helper with in-memory cache (5min TTL)
  - `getBenefitsCatalog()`, `getBenefitsKeywords()`, `getBenefitsSocialCopy()`, `matchBenefitsInContent()`, `getJobBenefits()`
- `engagement-classifier.ts` — enriches `benefits_question` keywords from catalog at runtime via `hybridClassify()`
- `social-ai-service.ts` — expanded static fallback keywords to include all catalog entries

### 5. Voice Agent Integration
- `useElevenLabsVoice.tsx` — fetches structured job benefits via `useJobBenefits()` and passes them as `benefits` in the job context dynamic variables

## Files changed
- **New**: `supabase/migrations/..._benefits_schema.sql`
- **New**: `src/config/benefits.config.ts`
- **New**: `supabase/functions/_shared/benefits-catalog.ts`
- **Modified**: `src/features/social-engagement/config/socialBeacons.config.ts`
- **Modified**: `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`
- **Modified**: `supabase/functions/_shared/engagement-classifier.ts`
- **Modified**: `supabase/functions/_shared/social-ai-service.ts`
- **Modified**: `src/features/elevenlabs/hooks/useElevenLabsVoice.tsx`
