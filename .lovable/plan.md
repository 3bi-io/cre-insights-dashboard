

# Add Address Field to Application Form Location Section

## What Changes

An "Address" text input will be added to the Location section of the /apply form, allowing applicants to enter their street address (e.g., "123 Main St, Apt 4").

## Where It Appears

The address field will sit above the existing ZIP / City / State row, spanning the full width of the Location section. It will be optional (no asterisk), matching the style of the City field.

## Technical Details

### 1. Update Form Data Model: `src/hooks/useApplicationForm.ts`
- Add `address: string` to the `FormData` interface
- Add `address: ''` to `initialFormData`

### 2. Update PersonalInfoSection Props and UI: `src/components/apply/PersonalInfoSection.tsx`
- Add `address: string` to the `formData` prop type
- Insert a full-width `<Input>` field labeled "Address" with `autoComplete="street-address"` and a `MapPin` icon, placed between the "Location" header and the ZIP/City/State grid
- Uses the same `h-14 text-base rounded-xl border-2` styling as existing fields

### 3. Include Address in Submission: `src/hooks/useApplicationForm.ts`
- The `address` field is already part of `formData` and will be sent to the `submit-application` edge function automatically via the spread (`...data`)

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useApplicationForm.ts` | Add `address` to FormData interface and initial state |
| `src/components/apply/PersonalInfoSection.tsx` | Add `address` to props interface; render Address input in Location section |
