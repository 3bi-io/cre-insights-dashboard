

## Fix CDL Class Truncation and Permit Endorsement Logic

### Changes

**1. Shorten CDL Class descriptions** (`src/components/apply/CDLInfoSection.tsx`)
The current descriptions ("Combination vehicles", "Single vehicles 26,001+ lbs", "Hazmat/passenger vehicles") get truncated when rendered in a 3-column grid. Fix by shortening them:
- Class A: "Combination vehicles" -> "Combo vehicles"
- Class B: "Single vehicles 26,001+ lbs" -> "Heavy single"  
- Class C: "Hazmat/passenger vehicles" -> "Hazmat/passenger"

Also change CDL Class grid from `columns={3}` to `columns={2}` on mobile for better fit.

**2. Remove `truncate` from description text** (`src/components/apply/SelectionButton.tsx`)
The `truncate` CSS class on the description `<p>` tag (line 62) forces single-line clipping. Replace with line clamping or just remove truncation so text wraps naturally.

**3. Hide endorsements for Permit holders** (`src/components/apply/CDLInfoSection.tsx`)
Change the `showClassAndEndorsements` condition so endorsements only show for `cdl === 'Yes'`, while CDL Class still shows for both Yes and Permit:
- CDL Class: show for `Yes` and `Permit`
- Endorsements: show only for `Yes`

### Files to Modify
| File | Change |
|------|--------|
| `src/components/apply/CDLInfoSection.tsx` | Shorten CDL Class descriptions, split show logic for class vs endorsements |
| `src/components/apply/SelectionButton.tsx` | Remove `truncate` class from description text |

