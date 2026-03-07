

## Comprehensive Mobile-First UX Refactor Plan

After reviewing every public page, shared component, and the CSS foundation, here is the assessment. The codebase already has strong mobile foundations (44px touch targets, safe-area padding, bottom nav, MobileFilterSheet, StickyApplyCTA, prefers-reduced-motion). This plan focuses on the **real gaps**.

---

### 1. HEADER — Add Mobile Hamburger Drawer

**Current**: Mobile nav links are completely hidden; users rely only on bottom nav. No hamburger menu exists.

**Changes to `src/components/common/Header.tsx`**:
- Add hamburger icon (Menu/X) visible on `md:hidden`, right side next to ThemeToggle
- Add Sheet (side="right") with slide-in drawer containing all nav links + Sign In
- Each link: 48px min-height, icon + label + description, close on navigate
- Keep existing desktop nav unchanged, add subtle `hover:scale-[1.02]` on desktop links

---

### 2. HOMEPAGE HERO — Mobile Stack & Sizing

**Changes to `src/features/landing/components/sections/HeroSection.tsx`**:
- Hero heading: Change `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` to `text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl` (explicit 2rem on mobile)
- CTA buttons: Add `w-full sm:w-auto` to both buttons (already has `flex-col sm:flex-row`)
- Stats badges: Change `flex-wrap` to `flex-col sm:flex-row` so they stack on mobile
- Industry tags container: Add `overflow-x-auto scrollbar-hide` and `flex-nowrap sm:flex-wrap` for horizontal scroll on small screens
- Hero background: Add `objectPosition="center top"` to show faces/relevant content on mobile crops

---

### 3. JOBS PAGE — Already Well-Built, Minor Tweaks

**Current**: Already has MobileFilterSheet (bottom sheet), load more button, single-column on mobile, full-width search. These are done.

**Changes to `src/pages/public/JobsPage.tsx`**:
- Job card grid: Change gap from `gap-4` to `gap-3 sm:gap-4 lg:gap-6` for tighter mobile spacing

**Changes to `src/components/public/PublicJobCard.tsx`**:
- "View Details" and "Apply with Voice" buttons already stack vertically (w-full). No change needed.
- Add `aspect-ratio` to company logo avatar to prevent layout shift

---

### 4. JOB DETAILS PAGE — Minor Enhancements

**Current**: Already has StickyApplyCTA, mobile share with navigator.share, sidebar collapses below on mobile (lg:grid-cols-3).

**Changes to `src/pages/public/JobDetailsPage.tsx`**:
- Mobile share row: Prioritize native share — check `navigator.share` first, show LinkedIn/Copy as fallback
- Typography: Already has `text-xl sm:text-2xl lg:text-3xl` for title — good

---

### 5. DEMO PAGE — Scrollable Tab Bar

**Changes to `src/pages/public/DemoPage.tsx`**:
- TabsList: Change from `grid grid-cols-4` to `flex overflow-x-auto scrollbar-hide` on mobile, `grid grid-cols-4` on sm+
- Add `whitespace-nowrap` to each TabsTrigger
- Hero CTA buttons: Add `w-full sm:w-auto`

---

### 6. BLOG & RESOURCES — Scrollable FilterBar Tabs

**Changes to `src/components/shared/FilterBar.tsx`**:
- Tab container: Already has `overflow-x-auto scrollbar-hide` — good
- Add `touch-action: manipulation` and `min-h-[44px]` to tab buttons (currently `min-h-[36px]`)
- Search input on mobile: Change `max-w-xs` to `w-full sm:max-w-xs`

---

### 7. FEATURES PAGE — Mobile CTA Full-Width

**Changes to `src/pages/public/FeaturesPage.tsx`**:
- Hero CTA buttons: Already have `w-full sm:w-auto` — good
- Comparison table: Already has `overflow-x-auto` — good
- Scroll-spy nav: Already `hidden xl:block` — good

---

### 8. CLIENTS PAGE — No Major Changes

**Current**: Featured employers grid already responsive, industry tabs scrollable, GradientCTA already full-width on mobile.

---

### 9. GLOBAL CSS IMPROVEMENTS

**Changes to `src/index.css`**:
- Move `scroll-behavior: smooth` from mobile-only media query to global `html` (currently only in `@media (max-width: 767px)`)
- Add global `touch-action: manipulation` on interactive elements (already partially done, extend)
- Ensure `focus-visible` styles are consistent (already defined at line 229)
- The `prefers-reduced-motion` handling is already comprehensive (lines 295-312)

---

### 10. GRADIENT CTA — Already Good

**Current `src/components/shared/GradientCTA.tsx`**: Already has `flex-col sm:flex-row`, `w-full sm:w-auto`, `min-h-[52px]`, `max-w-md` constraint on mobile. No changes needed.

---

### 11. FOOTER — Already Good

**Current `src/components/public/PublicFooter.tsx`**: Already has accordion-style collapse on mobile (`toggleSection`), `min-h-[44px]` on links, proper vertical stacking. No changes needed.

---

### 12. INDUSTRY MODAL — Already Good

**Current**: Already uses `ResponsiveModal` (Dialog on desktop, Drawer on mobile). Already has horizontal scroll on mobile with dot indicators per memory. No changes needed.

---

### Summary of Actual Changes

| File | Change |
|------|--------|
| `Header.tsx` | Add mobile hamburger drawer with Sheet component |
| `HeroSection.tsx` | Mobile font sizing, full-width CTAs, stacking stats, scrollable tags |
| `JobsPage.tsx` | Tighter mobile grid gap |
| `JobDetailsPage.tsx` | Improve mobile share row (native share priority) |
| `DemoPage.tsx` | Scrollable tab bar on mobile |
| `FilterBar.tsx` | Larger touch targets (44px), full-width search on mobile |
| `index.css` | Global smooth scroll, extend touch-action |

Most components (Footer, GradientCTA, PublicJobCard, MobileFilterSheet, StickyApplyCTA, IndustryShowcaseModal, PublicBottomNav) are already mobile-optimized and need no changes.

**Estimated scope**: 7 files, ~150 lines changed. Focused on the real gaps rather than touching already-optimized components.

