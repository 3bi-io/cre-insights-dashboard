

# Hero Section Refactoring Plan

## Problem Analysis

Reviewing all 7 public-facing hero sections reveals two distinct design languages competing for attention:

### Group A: Modern, High-Contrast (Homepage, Jobs, Employers)
- Left-aligned content
- Black text on visible background
- White pill-shaped badges for data/subtitles
- Clean, scannable hierarchy
- Strong readability across devices

### Group B: Legacy Centered Style (Features, Blog, Resources, Contact)
- Centered layout with semantic color tokens (`text-foreground`, `text-muted-foreground`)
- shadcn `Badge` component with translucent styling (`bg-primary/10 text-primary`)
- Gradient accent text (`bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`)
- Floating blur blobs on some pages (Features, Contact)
- Low contrast against dark hero images -- badge text and subheadlines wash out

### Specific Issues Identified

1. **Features page** (IMG_1130): "Feature-Rich Platform" badge is nearly invisible. Gradient accent on "Modern Recruiting" has low contrast against the dark shield image. Floating blur blobs add visual noise.

2. **Resources page** (IMG_1131): "Knowledge Base" badge with BookOpen icon is tiny and translucent. Subheadline text blends into the social-network image. Title uses `text-foreground` which maps to dark mode colors and clashes with the overlay.

3. **Blog page** (IMG_1132): "Insights & Resources" badge barely visible. Gradient accent on "Blog" has weak contrast. Shield image behind is visually heavy for a content page.

4. **Contact page** (IMG_1133): "Get in Touch" headline readable but gradient accent on "Touch" is low contrast. Subheadline text nearly disappears into the social-network background. Floating blur blobs are distracting.

5. **Jobs vs Employers inconsistency**: Jobs uses `overlayVariant="gradient"` at 55% while Employers uses `overlayVariant="dark"` at 70%, creating noticeably different brightness levels for pages that serve the same audience.

---

## Refactoring Strategy

Standardize all hero sections to match the proven Group A pattern (Homepage/Jobs/Employers) with these principles:

- **Left-aligned** content within a `max-w-3xl` container
- **White pill badges** instead of shadcn Badge component
- **Explicit `text-black`** for headlines (guaranteed contrast over any overlay)
- **Remove gradient text** accents -- replace with white text accent spans for headline emphasis
- **Remove floating blur blobs** -- they add visual noise without value
- **Standardize overlays** to `overlayVariant="dark"` with `overlayOpacity={65}` for compact pages

---

## Page-by-Page Changes

### 1. Features Page (`src/pages/public/FeaturesPage.tsx`)

**Current**: Centered layout, translucent Badge, gradient text, floating blobs
**Target**: Left-aligned, white pill badge, high-contrast text, no blobs

| Element | Before | After |
|---------|--------|-------|
| Layout | `text-center` | Left-aligned `max-w-3xl` |
| Badge | `<Badge className="bg-primary/10 text-primary">` | `<span className="... text-black bg-white rounded-full ...">` |
| Headline | `text-foreground` + gradient accent | `text-black` + `text-white` accent |
| Subheadline | `text-muted-foreground` | `text-black bg-white rounded-full` pill |
| Overlay | dark, 70% | dark, 65% |
| Blobs | Present | Removed |
| CTA button | Present in hero | Moved below hero (keep focus on headline) |

### 2. Blog Page (`src/pages/public/BlogPage.tsx`)

**Current**: Centered, icon badge, gradient text
**Target**: Left-aligned, white pill badge, clean text

| Element | Before | After |
|---------|--------|-------|
| Layout | `text-center` | Left-aligned `max-w-3xl` |
| Badge | `<Badge>` with BookOpen icon | White pill: "Insights & Resources" |
| Headline | `text-foreground` + gradient "Blog" | `text-black` + `text-white` "Blog" |
| Subheadline | `text-muted-foreground` | White pill badge style |
| Image | social-hero | social-hero (keep) |
| Overlay | gradient, 55% | dark, 65% |

### 3. Resources Page (`src/pages/public/ResourcesPage.tsx`)

**Current**: Centered, icon badge, semantic colors
**Target**: Left-aligned, white pill badge, explicit colors

| Element | Before | After |
|---------|--------|-------|
| Layout | `text-center` | Left-aligned `max-w-3xl` |
| Badge | `<Badge>` with BookOpen icon | White pill: "Knowledge Base" |
| Headline | `text-foreground` | `text-black` |
| Subheadline | `text-muted-foreground` | White pill badge style |
| Image | trust-hero | trust-hero (keep) |
| Overlay | gradient, 55% | dark, 65% |

### 4. Contact Page (`src/pages/public/ContactPage.tsx`)

**Current**: Centered, gradient accent, floating blobs
**Target**: Left-aligned, white pill badge, clean

| Element | Before | After |
|---------|--------|-------|
| Layout | `text-center` | Left-aligned `max-w-3xl` |
| Headline | `text-foreground` + gradient "Touch" | `text-black` + `text-white` "Touch" |
| Subheadline | `text-muted-foreground` | White pill badge style |
| Overlay | dark, 70% | dark, 65% |
| Blobs | Present | Removed |

### 5. Employers Page (`src/components/public/clients/ClientsHero.tsx`)

**Minor tweak only**: Change overlay to match Jobs page for consistency.

| Element | Before | After |
|---------|--------|-------|
| Overlay | dark, 70% | dark, 65% |

### 6. Jobs Page (`src/features/jobs/components/public/JobsPageHeader.tsx`)

**Minor tweak only**: Overlay alignment.

| Element | Before | After |
|---------|--------|-------|
| Overlay (in parent) | gradient, 55% | dark, 65% |

### 7. Homepage (`src/features/landing/components/sections/HeroSection.tsx`)

**No changes** -- this is the flagship hero and the design target. Retains `full` variant, slideshow, and gradient overlay at 60%.

---

## Updated Consistency Guide

After refactoring, all compact-variant pages will follow this standard pattern:

```text
+----------------------------------------------------------+
|  [Background Image with dark overlay @ 65%]              |
|                                                          |
|  [White Pill Badge]                                      |
|                                                          |
|  Headline in Black                                       |
|  with Accent in White                                    |
|                                                          |
|  [White Pill Subheadline]                                |
|                                                          |
+----------------------------------------------------------+
```

---

## Files to Modify

| File | Scope |
|------|-------|
| `src/pages/public/FeaturesPage.tsx` | Hero section rewrite (lines 76-106) |
| `src/pages/public/BlogPage.tsx` | Hero section rewrite (lines 35-55) |
| `src/pages/public/ResourcesPage.tsx` | Hero section rewrite (lines 178-199) |
| `src/pages/public/ContactPage.tsx` | Hero section rewrite (lines 233-253) |
| `src/components/public/clients/ClientsHero.tsx` | Overlay tweak |
| `src/pages/public/JobsPage.tsx` | Overlay tweak (parent HeroBackground) |
| `docs/HERO_VISUAL_CONSISTENCY_GUIDE.md` | Update standards to reflect new pattern |

---

## What Does NOT Change

- Homepage hero (already the target design)
- Background image assignments per page
- HeroBackground component internals
- Content below the hero sections
- Mobile responsiveness behavior
- SEO/structured data

