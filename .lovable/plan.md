

## Remove Redundant Screening Questions from CDL Section

### Problem
The screenshots show that CDL-related screening questions (e.g., "Do you currently hold an active Class A CDL license?" and "How many years of Class A CDL driving experience do you have?") are rendered as **additional** Select dropdowns below the existing native CDL buttons and experience buttons. This is redundant -- the user is answering the same thing twice.

### Solution
Instead of displaying screening questions that overlap with existing form fields, **auto-populate** their answers from the native field values. Only render screening questions that don't have a corresponding native field.

### Technical Changes

**1. `src/components/apply/ApplicationForm.tsx`**
- Add a `useEffect` that watches `formData.cdl`, `formData.experience`, `formData.cdlClass`, and `formData.drug` values
- When these change, auto-map them to matching screening question answers in `custom_questions` using keyword detection on the question text:
  - Questions matching "hold" + "CDL" or "active" + "CDL" -> map from `formData.cdl` (Yes/No)
  - Questions matching "years" + "experience" or "how many" + "experience" -> map from `formData.experience` value
  - Questions matching "drug" + "test" or "DOT" -> map from `formData.drug`
- Filter these auto-mapped questions OUT of `cdlScreeningQuestions` and `backgroundScreeningQuestions` so they are not rendered as duplicate dropdowns
- The auto-populated answers still get submitted in `custom_questions` for webhook delivery

**2. `src/components/apply/CDLInfoSection.tsx`**
- No structural changes needed -- it will simply receive fewer (or zero) screening questions to render since the redundant ones are filtered out upstream

**3. `src/components/apply/BackgroundInfoSection.tsx`**  
- Same as above -- drug-test-related screening questions that overlap with the native drug test field will be filtered out

### How Auto-Mapping Works

```text
Native Field          Screening Question Pattern              Mapped Value
-----------          --------------------------              ------------
formData.cdl         /hold.*cdl|active.*cdl|cdl.*license/i   "Yes" / "No"
formData.experience  /years.*experience|how many.*experience/i  Closest option match
formData.drug        /drug.*test|dot.*test/i                 "Yes" / "No"
```

The mapping will find the best-matching option from the screening question's `options` array (using the option value or label) so the answer is always valid for that question's schema.

