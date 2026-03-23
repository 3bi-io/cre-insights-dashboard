# Hero Visual Consistency Guide

This document establishes the visual standards for hero sections across all public-facing pages on the Apply AI platform.

---

## Design Standard

All compact hero sections follow a **left-aligned, high-contrast** pattern:

```text
+----------------------------------------------------------+
|  [Background Image with dark overlay @ 65%]              |
|                                                          |
|  [White Pill Badge]  (text-black bg-white rounded-full)  |
|                                                          |
|  Headline in Black                                       |
|  with Accent in White                                    |
|                                                          |
|  [White Pill Subheadline]                                |
|                                                          |
+----------------------------------------------------------+
```

### Key Principles
- **Left-aligned** content within a `max-w-3xl` container
- **White pill badges** (`text-black bg-white rounded-full`) instead of shadcn `Badge`
- **`text-foreground`** for headlines (adapts to light/dark mode automatically)
- **`text-white`** for accent spans in headlines
- **No gradient text**, no floating blur blobs, no translucent badges
- **Standardized overlays**: `overlayVariant="dark"` with `overlayOpacity={65}`

---

### Dark Mode Support

Hero sections are fully theme-adaptive:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Headlines (`text-foreground`) | Near-black | Near-white |
| Accent spans (`text-white`) | White | White |
| White pill badges (`bg-white text-black`) | White bg, black text | White bg, black text |
| Overlay (primary) | White at configured opacity | Dark at configured opacity |
| Overlay (secondary) | Fixed neutral `from-black/10 to-black/20` | Same (theme-independent) |
| Vignette | Fixed `hsl(0 0% 0%/0.15)` | Same (theme-independent) |

**Important**: The secondary gradient and vignette layers in `HeroBackground` use fixed neutral colors (not theme tokens) to prevent overlay stacking that would make dark mode heroes nearly opaque.

---

## Component Overview

All hero sections use the `HeroBackground` component from `@/components/shared` which provides:
- Responsive background images with lazy loading
- Configurable overlay variants and opacity
- WCAG-compliant contrast for overlaid text
- Two size variants: `full` (landing) and `compact` (listing pages)

---

## Hero Image Assets

All hero images are stored in `src/assets/hero/` and imported as ES6 modules:

| Asset | File | Use Case | Theme |
|-------|------|----------|-------|
| Voice Hero | `voice-hero.png` | Homepage | AI/Voice technology |
| Jobs Hero | `jobs-hero.png` | Jobs | Workforce/industry |
| Social Hero | `social-hero.png` | Blog, Features | Social connections |
| Trust Hero | `trust-hero.png` | Resources, Contact | Security, compliance |
| Transport Hero | `transport-hero.png` | Companies/Clients | Fleet operations |

---

## Page Configuration Matrix

| Page | Route | Variant | Image | Overlay | Opacity | Layout |
|------|-------|---------|-------|---------|---------|--------|
| **Homepage** | `/` | `full` | voice-hero | gradient | 60% | Left-aligned, slideshow |
| **Jobs** | `/jobs` | `compact` | jobs-hero | dark | 65% | Left-aligned |
| **Blog** | `/blog` | `compact` | social-hero | dark | 65% | Left-aligned |
| **Resources** | `/resources` | `compact` | trust-hero | dark | 65% | Left-aligned |
| **Features** | `/features` | `compact` | social-hero | dark | 65% | Left-aligned |
| **Contact** | `/contact` | `compact` | trust-hero | dark | 65% | Left-aligned |
| **Companies** | `/clients` | `compact` | transport-hero | dark | 65% | Left-aligned |

---

## Compact Hero Template

All compact-variant pages use this pattern:

```tsx
<HeroBackground
  imageSrc={heroImage}
  imageAlt="Descriptive alt text"
  variant="compact"
  overlayVariant="dark"
  overlayOpacity={65}
>
  <div className="container mx-auto px-4">
    <div className="max-w-3xl">
      <span className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6">
        Badge Text
      </span>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-foreground">
        Headline Text
        <span className="text-white"> Accent</span>
      </h1>
      <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
        Subheadline text
      </span>
    </div>
  </div>
</HeroBackground>
```

---

## Full Hero (Homepage Only)

The homepage retains `full` variant with slideshow and gradient overlay at 60%:

```tsx
<HeroBackground
  imageSrc={voiceHero}
  imageAlt="Description"
  slideshowImages={[cyberHero, tradesHero, healthcareHero]}
  variant="full"
  overlayVariant="gradient"
  overlayOpacity={60}
>
  {/* Left-aligned content with industry tags, CTA buttons */}
</HeroBackground>
```

---

## What NOT To Use

| ❌ Avoid | ✅ Use Instead |
|----------|---------------|
| `<Badge className="bg-primary/10 text-primary">` | `<span className="... text-black bg-white rounded-full ...">` |
| `text-black` for hero headlines | `text-foreground` (theme-adaptive) |
| `text-muted-foreground` in heroes | `text-foreground` or white pill badge |
| `bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent` | `text-white` accent span |
| Floating blur blobs (`bg-primary/10 rounded-full blur-3xl`) | Nothing — remove them |
| `text-center` layout | Left-aligned `max-w-3xl` container |
| `overlayVariant="gradient"` on compact pages | `overlayVariant="dark"` at 65% |
| `from-background/20` in overlay layers | Fixed neutrals `from-black/10` |

---

## Accessibility Requirements

1. **Image Alt Text**: Always provide descriptive `imageAlt` prop
2. **Contrast**: Black text on white pill badges ensures 21:1 ratio
3. **Reduced Motion**: Use `motion-safe:` prefix for animations (homepage only)
4. **Screen Reader**: Component includes `<span className="sr-only">{imageAlt}</span>`

---

## Checklist for New Pages

- [ ] Import appropriate hero image from `@/assets/hero/`
- [ ] Use `HeroBackground` component with `variant="compact"`
- [ ] Set `overlayVariant="dark"` and `overlayOpacity={65}`
- [ ] Use left-aligned layout with `max-w-3xl` container
- [ ] White pill badge for category label
- [ ] `text-black` headline with `text-white` accent
- [ ] White pill subheadline
- [ ] Test readability on mobile and desktop
- [ ] No floating blobs or gradient text

---

## File References

- **Component**: `src/components/shared/HeroBackground.tsx`
- **Export**: `src/components/shared/index.ts`
- **Assets**: `src/assets/hero/*.png`

---

*Last updated: February 2026*
