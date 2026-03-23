

# Replace "ATS.me" References with "Apply AI"

## Scope

All `https://ats.me` URL references were already cleaned up previously. What remains are **brand name text references** ("ATS.me") in UI-facing source files and one generated filename.

## Source Code Changes (4 files)

### 1. `src/utils/roiCalculatorGenerator.ts`
- Replace all "ATS.me" text → "Apply AI" in spreadsheet content (title, instructions, descriptions)
- Rename output file from `ats-me-roi-calculator.xlsx` → `apply-ai-roi-calculator.xlsx`

### 2. `src/features/demo/FlowDemoTab.tsx` (line 45)
- `"With ATS.me, you connect..."` → `"With Apply AI, you connect..."`

### 3. `src/pages/public/DemoPage.tsx` (lines 100, 119)
- `"Why Choose ATS.me?"` → `"Why Choose Apply AI?"`
- `"...using ATS.me to hire..."` → `"...using Apply AI to hire..."`

### 4. `src/components/landing/BenefitsSection.tsx` (line 22)
- `"Why Organizations Choose ATS.me"` → `"Why Organizations Choose Apply AI"`

## Not Changed (intentional)

- **`src/utils/blogImageUtils.ts`** — References like `why-ats-me-will-thrive-2026` are blog post slugs and asset filenames tied to actual files on disk and published URLs. Changing them would break image loading and blog routing.
- **Markdown docs** (`CHANGELOG.md`, `CONTRIBUTING.md`, `PHASE_7_COMPLETE.md`, `docs/`) — Internal developer documentation, not user-facing. Can update separately if desired.

