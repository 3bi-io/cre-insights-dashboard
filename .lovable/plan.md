

## Integrate Screening Questions Into Existing Form Steps

### What Changes
Instead of showing screening questions as a separate Step 4, they will be appended inline to the most relevant existing step. The form will always be 4 steps: Personal, CDL, Background, Consent.

### How It Works

Each screening question will be mapped to an existing step based on its `id`:
- **CDL-related** (`valid_cdl`, `experience`, `cdl_class`, or any ID containing "cdl", "license", "experience", "driving") -- appended to **Step 2 (CDL)**
- **Everything else** (background checks, drug tests, availability, etc.) -- appended to **Step 3 (Background)**

The questions will render at the bottom of their respective section using the existing `Select` dropdown UI from `ScreeningQuestionsSection`, styled to match the section's visual pattern. Answers still go into `formData.custom_questions` for webhook delivery.

---

### Technical Changes

**1. `src/components/apply/ApplicationForm.tsx`**
- Remove the separate screening `StepContainer` (Step 4)
- Revert `totalSteps` back to always `4`
- Remove `hasScreening` prop from `FormProgressIndicator`
- Add a helper function to split screening questions into two groups: `cdlQuestions` and `backgroundQuestions` based on ID pattern matching
- Pass the relevant question group + answers + handler to `CDLInfoSection` and `BackgroundInfoSection`
- Move screening validation into the existing step 2 and step 3 validators (required screening questions in the CDL group validate in step 2, others in step 3)

**2. `src/components/apply/CDLInfoSection.tsx`**
- Add optional `screeningQuestions`, `screeningAnswers`, and `onScreeningAnswerChange` props
- Render any provided screening questions at the bottom of the section using `Select` dropdowns (matching existing styling)

**3. `src/components/apply/BackgroundInfoSection.tsx`**
- Same new optional props as CDLInfoSection
- Render any provided screening questions at the bottom, after the veteran status field

**4. `src/components/apply/FormProgressIndicator.tsx`**
- Remove the `hasScreening` prop and revert to always showing 4 steps (Personal, CDL, Background, Consent)

**5. `src/components/apply/ScreeningQuestionsSection.tsx`**
- No longer rendered as a standalone step, but the component can be reused as an inline sub-component within CDL and Background sections (or its rendering logic inlined directly)

