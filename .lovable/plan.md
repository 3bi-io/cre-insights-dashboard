

# Add Legal Consent Statement to Application Forms

## Overview

Add the following legal statement to all three application form pages:

> *"By submitting this form, you agree we can contact you for follow-ups—via outbound calls, texts, emails, or other digital means—using AI tools or automated systems at the info you shared. Standard rates might apply, and you can opt out anytime."*

## Current State

| Route | Form Component | Consent Section |
|-------|---------------|-----------------|
| `/apply` | `ApplicationForm.tsx` | `ConsentSection.tsx` |
| `/embed/apply` | `EmbedApplicationForm.tsx` | `ConsentSection.tsx` |
| `/apply/detailed` | `DetailedApplicationForm.tsx` | `DetailedConsentSection.tsx` |

Both quick apply routes (`/apply` and `/embed/apply`) share the same `ConsentSection.tsx` component, so only **two files** need to be modified.

## Implementation Plan

### 1. Update ConsentSection.tsx

Add the legal statement in the summary section at the bottom of the consent form (currently lines 134-139).

**Current:**
```jsx
<div className="bg-muted/50 rounded-xl p-4 text-center">
  <p className="text-sm text-muted-foreground">
    By submitting, you confirm that the information provided is accurate and complete.
  </p>
</div>
```

**Updated:**
```jsx
<div className="bg-muted/50 rounded-xl p-4 space-y-3">
  <p className="text-sm text-muted-foreground text-center">
    By submitting, you confirm that the information provided is accurate and complete.
  </p>
  <p className="text-xs text-muted-foreground/80">
    By submitting this form, you agree we can contact you for follow-ups—via 
    outbound calls, texts, emails, or other digital means—using AI tools or 
    automated systems at the info you shared. Standard rates might apply, 
    and you can opt out anytime.
  </p>
</div>
```

### 2. Update DetailedConsentSection.tsx

Add a new summary section at the bottom of the consent form (after line 259) with the legal statement.

**Add before closing `</div>`:**
```jsx
{/* Legal Disclosure */}
<div className="bg-muted/50 rounded-xl p-4 space-y-3">
  <p className="text-sm text-muted-foreground text-center">
    By submitting, you confirm that the information provided is accurate and complete.
  </p>
  <p className="text-xs text-muted-foreground/80">
    By submitting this form, you agree we can contact you for follow-ups—via 
    outbound calls, texts, emails, or other digital means—using AI tools or 
    automated systems at the info you shared. Standard rates might apply, 
    and you can opt out anytime.
  </p>
</div>
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/apply/ConsentSection.tsx` | Update summary section to include legal statement |
| `src/components/apply/detailed/DetailedConsentSection.tsx` | Add new legal disclosure section at bottom |

## Design Considerations

- The statement uses smaller text (`text-xs`) to distinguish it from the main consent confirmations
- Slightly muted opacity (`text-muted-foreground/80`) indicates supplementary legal text
- Placed at the bottom of consent sections, above the submit button
- Both forms will display the statement consistently

## Technical Details

- No new dependencies required
- No changes to form validation logic
- Statement is purely informational (not a required checkbox)
- Applies to all submission paths including "Skip to Submit" quick flow

