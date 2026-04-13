

# Plan: Church Transportation Required Fields & Customization

## Summary
Configure Church Transportation's detailed application form to enforce required fields, remove irrelevant questions, and restrict experience options to 18+ months only.

## Church Transportation Client ID
`dffb0ef4-07a0-494f-9790-ef9868e143c7` (from existing config)

## Step 1: Database Migration — Insert field configuration rows

Insert rows into `client_application_fields` for Church Transportation:

**Fields to make required (enabled=true, required=true):**
| field_key | Purpose |
|---|---|
| `dateOfBirth` | Date of Birth |
| `ssn` | SSN (last 4) |
| `address1` | Street Address |
| `experience` | Driving experience |
| `cdlClass` | CDL Class (when CDL=yes) |
| `medicalCardExpiration` | Med card expiration |
| `accidentHistory` | Accident history |
| `violationHistory` | Moving violations |
| `employers` | Previous employment |
| `convictedFelony` | Felony question |

**Fields to disable (enabled=false):**
| field_key | Purpose |
|---|---|
| `canWorkWeekends` | Remove — OTR position, weekends required |
| `canWorkNights` | Remove — OTR position |
| `experienceLowOptions` | Signal to hide experience options below 18 months |

## Step 2: Code Change — Filter experience options for client config

**File:** `src/components/apply/detailed/DetailedCDLSection.tsx`

Add logic to check `isFieldEnabled('experienceLowOptions')`. When disabled, filter the `EXPERIENCE_OPTIONS` array to only show `'1-2 years'`, `'2-5 years'`, and `'5+ years'` (18+ months).

## Step 3: Code Change — Add required indicators to fields

Several fields (experience, accidentHistory, violationHistory, cdlClass, medicalCardExpiration, convictedFelony) currently don't show required asterisks from `isFieldRequired`. Update labels in:
- `DetailedCDLSection.tsx` — add required indicator to experience, cdlClass, medicalCardExpiration, accidentHistory, violationHistory
- `DetailedBackgroundSection.tsx` — add required indicator to convictedFelony
- `DetailedContactSection.tsx` — add required indicator to address1

## Step 4: Code Change — Validation enforcement

**File:** `src/hooks/useDetailedApplicationForm.ts`

The `validateStep` function currently hardcodes validation. It needs to be enhanced to respect `isFieldRequired` from client config. This requires passing the field config into the hook or extending the validation. The simplest approach: pass `clientId` into the hook, use `useClientFieldConfig` internally, and check required fields during validation for each step.

## What the applicant will see
- Steps 1-2: DOB, SSN, and full address all required with red asterisks
- Step 3: CDL Class required, med card expiration required, experience shows only "1-2 Years", "2-5 Years", "5+ Years" options; accident/violation history required
- Step 4: Employment history required (at least 1 employer with full info)
- Step 5: Felony question required; weekend/night work questions removed entirely
- Step 6: Consent step unchanged

