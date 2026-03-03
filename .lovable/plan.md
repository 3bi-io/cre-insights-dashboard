

# Partner Integration Setup Guide Page

## Overview
Create a `/partner-setup` page with an interactive onboarding checklist that walks partner organizations through the full integration process, step by step. It complements the existing `/api-docs` reference page by providing a guided, progress-tracked experience.

## What Gets Built

A single new page component `PartnerSetupGuidePage.tsx` with:

1. **Progress tracker** — visual stepper showing completion (e.g., "3 of 6 steps complete") using local state (no persistence needed for a public guide)

2. **Checklist steps**, each expandable (accordion) with instructions:
   - **Step 1: Request API Access** — Contact Apply AI or request via dashboard; what info to provide (org name, domains)
   - **Step 2: Receive API Key** — Explanation of what you'll get (key, allowed origins, rate limit)
   - **Step 3: Configure Environment** — Set `ORG_API_URL` and `ORG_API_KEY` in your app's environment; code snippet showing the base URL
   - **Step 4: Test Your Connection** — cURL / JS snippet to hit `/stats` and verify a 200 response
   - **Step 5: Integrate Data** — Choose between SDK embed (zero-code) or direct API calls; link to `/api-docs` for full reference
   - **Step 6: Go Live** — CORS checklist (production domain whitelisted?), rate limit awareness, support contact

3. **Sidebar quick-links** — Links to `/api-docs`, SDK reference, and support email

## Technical Details

- **New file**: `src/pages/PartnerSetupGuidePage.tsx`
- **Route**: Add `/partner-setup` in `AppRoutes.tsx` (public route, alongside `api-docs`)
- **Components used**: Existing `Card`, `Accordion`, `Badge`, `Button` from the UI library; `Helmet` for SEO; `CheckCircle2` / `Circle` icons from lucide for step status
- **State**: `useState` with a `Set<number>` of completed step indices; checkbox toggle per step
- **No database or backend changes** — purely a static guide page
- **Nav**: Add link from `ApiDocsPage` footer pointing to `/partner-setup` and vice versa

