

# Dark Mode Hero Section Refactoring Plan

## Problem

The `HeroBackground` component overlay uses `bg-background`, which resolves to:
- **Light mode**: white (`0 0% 100%`) -- hero text in `text-black` is readable
- **Dark mode**: near-black (`222.2 84% 4.9%`) -- hero text in `text-black` becomes invisible

This affects **every public-facing hero section** across the platform. The screenshots confirm:
- Headlines using `text-black` disappear entirely in dark mode
- Industry tag pills with `text-black bg-white` remain visible (they have their own background)
- White pill badges (`bg-white text-black`) remain readable
- The `text-white` accent spans on headlines also vanish against the dark overlay

Additionally, the secondary overlay layers in `HeroBackground.tsx` (gradient-to-b and radial vignette) both reference `hsl(var(--background))`, which compounds the darkening effect in dark mode, making the hero nearly opaque.

---

## Root Cause Analysis

The issue originates in the `HeroBackground` component at three layers:

1. **Primary overlay** (line 178-182): Uses `bg-background` with explicit opacity -- becomes black at 65% in dark mode
2. **Secondary gradient** (line 185-188): `from-background/20 ... to-background/40` adds another dark layer
3. **Vignette** (line 190-194): `hsl(var(--background)/0.3)` adds a third dark ring

Combined, these three layers stack to produce ~80-85% effective darkness in dark mode, leaving zero contrast for `text-black` content.

---

## Solution: Two-Part Fix

### Part 1: Theme-Adaptive Text Colors (All Hero Pages)

Replace all hardcoded `text-black` with `text-foreground` (which resolves to near-black in light mode and near-white in dark mode). Replace `text-white` accent spans with a dedicated class that stays visible in both themes.

| Element | Current Class | Proposed Class |
|---------|--------------|----------------|
| Hero headlines | `text-black` | `text-foreground` |
| Headline accent spans | `text-white` | `text-white dark:text-primary-foreground` (stays white in both) |
| Industry tag text | `text-black` | `text-foreground` |

White pill badges (`bg-white text-black rounded-full`) remain unchanged -- they carry their own white background and are readable in both modes.

### Part 2: Reduce Dark Mode Overlay Stacking (HeroBackground Component)

Modify the secondary overlay layers to use a fixed neutral instead of the theme `--background` token. This prevents triple-stacking dark overlays in dark mode:

- **Secondary gradient**: Change from `from-background/20 ... to-background/40` to `from-black/10 via-transparent to-black/20` (fixed, theme-independent)
- **Vignette**: Change from `hsl(var(--background)/0.3)` to `hsl(0 0% 0%/0.15)` (subtle fixed vignette)

This keeps the primary overlay adaptive (it still uses `bg-background` with the configured opacity), but prevents the secondary layers from doubling the darkness in dark mode.

---

## Page-by-Page Changes

### 1. HeroBackground Component (`src/components/shared/HeroBackground.tsx`)

| Line | Change |
|------|--------|
| 185-188 | Secondary gradient: `from-background/20 via-transparent to-background/40` becomes `from-black/10 via-transparent to-black/20` |
| 190-194 | Vignette: `hsl(var(--background)/0.3)` becomes `hsl(0 0% 0%/0.15)` |

### 2. Homepage Hero (`src/features/landing/components/sections/HeroSection.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Badge (line 44) | `text-black bg-white` | `text-black bg-white` (no change -- has own background) |
| Headline (line 49) | `text-black` | `text-foreground` |
| Headline accent (line 51) | `text-white` | `text-white` (no change -- white works in both) |
| Industry tags (line 61) | `text-black bg-white` | `text-black bg-white` (no change) |
| Subheadline (line 69) | `text-white ... bg-black/50` | No change (already has dark backdrop) |
| Company count pill (line 75) | `text-black ... bg-white` | No change (has own background) |

### 3. Jobs Page Header (`src/features/jobs/components/public/JobsPageHeader.tsx`)

| Element | Before | After |
|---------|--------|-------|
| h1 headline (line 13) | `text-black` | `text-foreground` |
| "Find Your Next Opportunity" subtitle pill (line 15) | `text-black ... bg-white` | No change |
| Jobs count pill (line 19) | `text-black ... bg-white` | No change |

### 4. Clients/Employers Hero (`src/components/public/clients/ClientsHero.tsx`)

| Element | Before | After |
|---------|--------|-------|
| h1 headline (line 20) | `text-black` | `text-foreground` |
| Company count pill (line 23) | `text-black ... bg-white` | No change |

### 5. Features Page (`src/pages/public/FeaturesPage.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Badge pill (line 85) | `text-black bg-white` | No change |
| h1 headline (line 88) | `text-black` | `text-foreground` |
| Accent span (line 90) | `text-white` | `text-white` (no change) |
| Subheadline pill (line 92) | `text-black bg-white` | No change |

### 6. Blog Page (`src/pages/public/BlogPage.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Badge pill (line 43) | `text-black bg-white` | No change |
| h1 headline (line 46) | `text-black` | `text-foreground` |
| Accent span (line 48) | `text-white` | `text-white` (no change) |
| Subheadline pill (line 50) | `text-black bg-white` | No change |

### 7. Resources Page (`src/pages/public/ResourcesPage.tsx`)

| Element | Before | After |
|---------|--------|-------|
| Badge pill (line 187) | `text-black bg-white` | No change |
| h1 headline (line 190) | `text-black` | `text-foreground` |
| Subheadline pill (line 193) | `text-black bg-white` | No change |

### 8. Contact Page (`src/pages/public/ContactPage.tsx`)

| Element | Before | After |
|---------|--------|-------|
| h1 headline (line 242) | `text-black` | `text-foreground` |
| Accent span (line 244) | `text-white` | `text-white` (no change) |
| Subheadline pill (line 246) | `text-black bg-white` | No change |

---

## Summary of All File Changes

| File | Scope |
|------|-------|
| `src/components/shared/HeroBackground.tsx` | Fix secondary overlay layers to use fixed neutral instead of theme token |
| `src/features/landing/components/sections/HeroSection.tsx` | Headline `text-black` to `text-foreground` |
| `src/features/jobs/components/public/JobsPageHeader.tsx` | Headline `text-black` to `text-foreground` |
| `src/components/public/clients/ClientsHero.tsx` | Headline `text-black` to `text-foreground` |
| `src/pages/public/FeaturesPage.tsx` | Headline `text-black` to `text-foreground` |
| `src/pages/public/BlogPage.tsx` | Headline `text-black` to `text-foreground` |
| `src/pages/public/ResourcesPage.tsx` | Headline `text-black` to `text-foreground` |
| `src/pages/public/ContactPage.tsx` | Headline `text-black` to `text-foreground` |
| `docs/HERO_VISUAL_CONSISTENCY_GUIDE.md` | Update dark mode guidelines |

---

## What Does NOT Change

- White pill badge styling (`bg-white text-black rounded-full`) -- these have their own white background and work in both themes
- Homepage subheadline with `bg-black/50 backdrop-blur-sm` -- already theme-safe
- Primary overlay logic (still uses `bg-background` with configurable opacity)
- Background image assignments
- Hero layout structure (left-aligned `max-w-3xl`)
- CTA button styling

---

## Expected Dark Mode Result

After refactoring, the dark mode hero will render as:
- Dark overlay at ~65% over the background image (image still partially visible)
- Headlines in light text (`text-foreground` resolves to near-white `210 40% 98%`)
- Accent spans in white (high contrast against dark overlay)
- White pill badges pop against the dark hero (even better contrast than light mode)
- Reduced secondary overlay stacking prevents the hero from appearing nearly opaque

