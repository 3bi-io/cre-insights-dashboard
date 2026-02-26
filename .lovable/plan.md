

## Refactor Industry Showcase Modal for Best-in-Class UX

### Current Issues
- Basic visual design with minimal hierarchy -- feels like a settings dialog, not a showcase
- Industry cards are small and cramped (especially on 3-col mobile grid)
- Detail panel is plain with flat badges -- no visual storytelling
- No entrance stagger animation on cards
- Terminology tags feel disconnected from the feature badges
- "Don't show again" link looks like an afterthought
- Missing screening focus content from templates (wasted data)
- CTAs lack visual weight differentiation
- No visual indicator showing industry-specific value proposition

### Refactored Design

**Layout Changes:**
- Widen modal to `sm:max-w-2xl` for breathing room
- Industry selector becomes a horizontal scrollable row on mobile (no cramped grid), 5-col on desktop
- Cards get icon backgrounds with subtle gradient rings when active
- Detail panel gets a two-section layout: features left, AI screening focus right

**Visual Polish:**
- Add staggered entrance animation to industry cards using Framer Motion
- Active card gets a subtle glow/ring effect instead of just border color
- Detail panel header includes the industry icon alongside the name
- Feature badges get colored dot indicators
- Screening focus items displayed as a compact checklist with check icons
- Gradient accent line between header and content

**Interaction Improvements:**
- Cards animate on hover with slight lift (`scale(1.03)`)
- Detail panel crossfades with `layout` animation for smoother height transitions
- Primary CTA gets gradient background matching platform brand
- "Don't show again" moved into footer row, styled as ghost button

**Content Enhancement:**
- Add a short value proposition line per industry (e.g., "Screen CDL drivers in minutes, not days")
- Show screening focus as checklist items with CheckCircle icons
- Combine features + terminology into a unified "What's Included" section

### Technical Changes

**File: `src/features/landing/components/IndustryShowcaseModal.tsx`**
- Widen modal container
- Refactor industry cards with staggered motion, hover lift, gradient active ring
- Redesign detail panel with icon header, two-column layout (features + screening focus)
- Add CheckCircle icons for screening focus items
- Restyle CTAs: primary gets gradient, outline stays as-is
- Move "Don't show again" into the footer as a subtle ghost button
- Add `Sparkles` icon to header for visual flair

**File: `src/features/organizations/config/industryTemplates.config.ts`**
- Add a `valueProposition` string to each template for the detail panel tagline

**File: `src/features/organizations/types/industryTemplates.types.ts`**
- Add optional `valueProposition?: string` to `IndustryTemplateConfig`

**No changes needed:**
- `useShowcaseModal.ts` -- trigger logic is solid
- `ResponsiveModal` -- component works well as-is
- `LandingPage.tsx` -- integration is already correct

