

## Plan: Add Experience & Compliance Sections to Applicant Quick View

### Problem
The `ApplicantQuickView` sheet only shows contact info, stage, source, applied date, readiness score, ATS status, recruiter, and notes. It's missing CDL/experience details and compliance/background fields — data that exists in the `applications` table but isn't queried or rendered.

### Changes

#### 1. Update `useClientApplications` query to fetch missing fields
**File:** `src/features/clients/hooks/useClientApplications.ts`
- Add to the select: `cdl, cdl_class, cdl_state, cdl_endorsements, cdl_expiration_date, exp, driving_experience_years, months, violation_history, accident_history, convicted_felony, felony_details, can_pass_drug_test, can_pass_physical, background_check_consent, veteran, work_authorization, dot_physical_date, medical_card_expiration, hazmat_endorsement, twic_card`
- Add corresponding fields to the `ClientApplication` interface

#### 2. Add Experience section to `ApplicantQuickView`
**File:** `src/features/clients/components/ats/ApplicantQuickView.tsx`
- New **Experience** section after the Details Grid showing:
  - CDL Class (e.g. "Class A")
  - CDL State + expiration date
  - Endorsements (as badges)
  - Years of experience / months
  - Veteran status

#### 3. Add Compliance section to `ApplicantQuickView`
- New **Compliance** section after Experience showing:
  - Drug test eligibility
  - Physical eligibility
  - Background check consent
  - Violation history
  - Accident history
  - Felony status + details
  - DOT physical / medical card dates
  - HAZMAT / TWIC status
- Each item rendered conditionally (only when data exists), with check/x icons for yes/no fields

### Files changed (2)
- `src/features/clients/hooks/useClientApplications.ts` — expand query + interface
- `src/features/clients/components/ats/ApplicantQuickView.tsx` — add Experience & Compliance sections

