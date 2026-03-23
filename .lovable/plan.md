

# Add Minimum Experience Qualification Gate to Outbound Calls

## Problem
Candidates with insufficient experience (like Delisha Gardner with 0 months for Pemberton) are being transferred by the AI agent because there's no code-level guard.

## Changes

### 1. Database Migration
Add `min_experience_months` column to `job_listings` and set Pemberton's minimum to **6 months**:
```sql
ALTER TABLE public.job_listings 
ADD COLUMN min_experience_months integer DEFAULT NULL;

UPDATE public.job_listings 
SET min_experience_months = 6 
WHERE client_id IN (
  SELECT id FROM clients WHERE name ILIKE '%pemberton%'
);
```

### 2. Update Edge Function: `elevenlabs-outbound-call/index.ts`

**A. Fetch `min_experience_months`** in the job listing query.

**B. Add experience qualification check** in `buildDynamicVariables`:
- Parse applicant's months from `application.months`, `driving_experience_years`, or `exp`
- Compare against `jobListing.min_experience_months`
- Set new dynamic variables:
  - `meets_minimum_experience`: `'yes'` | `'no'` | `'unknown'`
  - `minimum_experience_required`: e.g. `'6 months'`
  - `experience_disqualification_note`: When `'no'`, instructs agent: *"This candidate has X months of experience but this position requires a minimum of 6 months. Politely let them know they don't currently meet the minimum experience requirement, but that {company} would love for them to apply again once they have more experience. Do NOT transfer this call."*

When `min_experience_months` is NULL on a job, the gate is skipped (backward compatible). No frontend or prompt changes needed.

