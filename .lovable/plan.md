

# Refactor: Founders Pass Page -- Best-in-Class Mobile-First UX

## Current Issues

1. **Content not scrolling on mobile** -- After the hero section, pricing/included/how-it-works/CTA sections exist in code but aren't visible when scrolling on mobile devices. On desktop, scrolling past the pricing section reveals a blank dark void.
2. **Not using platform design system** -- The page uses custom inline styles instead of the established `SectionWrapper`, `SectionHeader`, and `HeroBackground` components that every other public page uses.
3. **Hero is centered layout** -- Violates the platform's left-aligned hero design standard used on all other public pages.
4. **No social proof or urgency** -- Missing trust indicators, comparison context, or scarcity mechanics that high-converting landing pages need.
5. **Single CTA type** -- Only offers voice agent CTA. Users who don't want a phone call have no alternative path.

## Refactored Architecture

The page will be rebuilt as a single-scroll conversion funnel following the platform's established component system, optimized for mobile-first thumb-reach ergonomics.

### Section Flow (top to bottom)

1. **Hero** -- `HeroBackground` component, left-aligned headline, dual CTAs (voice + text), $3 total price anchor visible above the fold
2. **Pricing Breakdown** -- `SectionWrapper` with 3 horizontal pricing cards showing $1+$1+$1=$3 math visually. Stacked vertically on mobile with swipe feel
3. **What's Included** -- `SectionWrapper variant="muted"` with check-list grid, mobile-optimized with card backgrounds for touch targets
4. **How It Works** -- 3-step vertical timeline on mobile, horizontal on desktop, using step images
5. **CTA Footer** -- `SectionWrapper variant="gradient"` with both voice CTA and secondary text link, urgency badge, trust footer

### Technical Changes

#### File: `src/pages/public/FoundersPassPage.tsx` (full rewrite)

- Replace custom hero with `HeroBackground` component (left-aligned, uses `founders-pass-hero.jpg`)
- Replace all custom sections with `SectionWrapper` + `SectionHeader` for consistent spacing, safe-area padding, and proper rendering in the scroll container
- Use `fadeInViewProps` from shared animation variants instead of custom `fadeUp`
- Add a secondary CTA link (e.g., "Talk to Sales" linking to `/contact?subject=founders-pass`) alongside the voice CTA for users who prefer text
- Add a sticky mobile CTA bar at the bottom (above bottom nav) that appears after scrolling past the hero -- provides persistent conversion access
- Use the content file (`foundersPass.content.ts`) consistently for all copy

#### File: `src/features/landing/content/foundersPass.content.ts` (minor updates)

- Add a `hero` object with left-aligned heading copy and a short social proof line (e.g., "Join 50+ fleets already onboarding")
- Add `comparisonNote` for the pricing summary visual

#### File: `src/features/landing/components/FoundersPassVoiceCTA.tsx` (minor update)

- Accept an optional `secondaryCTA` prop so the page can render the "Talk to Sales" link alongside it in the same flex container
- Ensure proper touch target sizing (min 48px) on mobile

### Mobile-Specific Optimizations

- All touch targets minimum 48x48px
- Pricing cards: full-width stacked with clear visual hierarchy
- How It Works: vertical timeline layout with left-aligned step images and text (no centering)
- Sticky bottom CTA bar with `pb-[env(safe-area-inset-bottom)]` for notched devices
- Sections use `py-12` on mobile, `py-20` on desktop (via `SectionWrapper`)
- No horizontal scrolling anywhere

### Performance

- Hero image loads eagerly via `HeroBackground priority={true}`
- Step images lazy-loaded
- All animations use `viewport={{ once: true }}` to avoid re-triggering
- No layout shifts from conditional rendering

