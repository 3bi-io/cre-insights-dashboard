

# Reduce Meta Traffic Drop-off: Social-Optimized Quick Apply Form

## Problem Analysis

Meta (Facebook/Instagram) traffic has a **1.3% form completion rate** (4 completions from 331 visits). The current Quick Apply form has **4 steps with 13+ required interactions**:

- **Step 1** (Personal Info): 6 required fields (first name, last name, email, phone, ZIP, age confirmation) + 3 optional (address, city, state) = 9 fields on one screen
- **Step 2** (CDL Info): CDL status + experience level + optional class/endorsements + screening questions
- **Step 3** (Background): Drug test + veteran status + screening questions
- **Step 4** (Consent): SMS consent + privacy policy = 2 toggle interactions

**Key friction points for mobile social traffic:**
1. Too many steps -- users from social feeds have very low patience (avg 3-8 seconds before abandoning)
2. Step 1 alone has 6 required fields -- overwhelming on a phone screen
3. Address/city/state fields appear required visually even though only ZIP is mandatory
4. CDL endorsements section expands into 6 checkboxes -- intimidating
5. No "skip to submit" shortcut after completing essential info
6. No source-aware UX -- Meta users see the exact same form as organic/direct visitors
7. Progress indicator shows 4 steps upfront which signals "this will take a while"

## Solution: Social-Source Express Apply Mode

Detect Meta traffic via URL params (`fbclid`, `utm_source=facebook|instagram|meta`) and serve a streamlined **2-step express form** that collects only the minimum fields needed for a valid lead, then encourages optional enrichment.

### Step 1 -- Contact Info (express mode)
- First name, last name, email, phone, ZIP -- 5 fields only
- Age confirmation (Yes/No toggle)
- Remove address, city, state from view (auto-filled silently from ZIP)
- Single large "Continue" button
- Progress shows "Step 1 of 2"

### Step 2 -- Quick Qualify + Submit (express mode)
- CDL status (4 options, no endorsements/class sub-questions)
- Experience level (simplified to 4 options: None, <1yr, 1-3yr, 3+yr)
- Drug test (Yes/No)
- SMS consent + privacy (combined into single checkbox: "I agree to receive texts and accept the privacy policy")
- Large "Submit Application" button
- Skip veteran status, screening questions, endorsements

### After submission
- Thank You page with "Complete your full profile" CTA linking to detailed form (existing flow)
- Backend still receives all standard fields (missing ones default to empty/null)

## Technical Plan

### 1. Create `SocialExpressForm` component
**New file: `src/components/apply/SocialExpressForm.tsx`**
- 2-step wizard using existing `useStepWizard` hook (totalSteps=2)
- Uses existing `useApplicationForm` hook for state management and submission
- Compact field layout optimized for mobile: larger touch targets, minimal labels
- Combined consent checkbox instead of two separate ConsentCard toggles
- Reduced experience options (4 instead of 7)
- No CDL class, endorsements, veteran, or screening question sections

### 2. Create `useSourceDetection` hook
**New file: `src/hooks/useSourceDetection.ts`**
- Reads `fbclid`, `utm_source`, `referral_source` from URL params and `document.referrer`
- Returns `{ isMetaTraffic: boolean, isSocialTraffic: boolean, source: string }`
- Detects: fbclid present, utm_source matches facebook/instagram/meta/fb/ig, referrer contains facebook.com or instagram.com

### 3. Modify `Apply.tsx` page
- Import `useSourceDetection` and `SocialExpressForm`
- When `isMetaTraffic` is true and not geo-blocked, render `SocialExpressForm` instead of `ApplicationForm`
- Pass same props (clientName, clientLogoUrl, industryVertical)

### 4. Modify `ApplicationHeader.tsx` (minor)
- When in express mode, show a smaller header with "Quick Apply" badge and estimated time ("< 1 minute")

### 5. No backend changes needed
- The `submit-application` edge function already handles optional/missing fields
- Source attribution already captures fbclid and utm_source

## Design Details

- Express form uses same card styling as current form
- Progress indicator simplified to 2 dots instead of labeled steps
- Step 1 heading: "Apply in under 60 seconds"
- Step 2 heading: "Almost done!"
- Submit button: "Submit Application" with rocket icon
- After step 1, show a reassuring micro-copy: "Your info is secure and encrypted"
- Mobile-first: all fields stack vertically, 56px input height maintained

## Expected Impact

Reducing from 13+ interactions across 4 steps to ~9 interactions across 2 steps should significantly improve completion rate for impatient social traffic. The combined consent checkbox alone removes 2 tap interactions. Hiding endorsements, veteran status, and screening questions removes another 3-8 interactions.

