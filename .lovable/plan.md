

# Show Legacy exp/cdl Fields as Fallbacks in Experience Section

## What This Does
When detailed experience fields (`cdl_class`, `driving_experience_years`, `cdl_endorsements`) are all null — common for external sources like ZipRecruiter — the Experience section is currently hidden entirely. This change makes it fall back to the legacy quick-apply fields (`cdl` and `exp`) so recruiters always see whatever data is available.

## Changes

### File: `src/features/clients/components/ats/ApplicantQuickView.tsx`

1. **Expand the visibility condition** (line 173): Include `application.cdl` and `application.exp` in the guard so the section renders when only legacy fields are present.

2. **Add fallback rendering** inside the grid (after line 210):
   - If `cdl_class` is null but `application.cdl` exists, render it as "CDL" 
   - If `driving_experience_years` is null but `application.exp` exists, render it as "Experience"

Roughly ~12 lines added, no new dependencies.

