# Hero Visual Consistency Guide

This document establishes the visual standards for hero sections across all public-facing pages on the ATS.me platform.

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
| Voice Hero | `voice-hero.png` | Homepage, Jobs | AI/Voice technology |
| Social Hero | `social-hero.png` | Blog, Features | Social connections, content |
| Trust Hero | `trust-hero.png` | Resources, Contact | Security, compliance |
| Transport Hero | `transport-hero.png` | Companies/Clients | Industry, fleet operations |
| ROI Hero | `roi-hero.png` | (Reserved) | Analytics, metrics |

---

## Page Configuration Matrix

| Page | Route | Variant | Image | Overlay | Opacity | Notes |
|------|-------|---------|-------|---------|---------|-------|
| **Homepage** | `/` | `full` | voice-hero | gradient | 60% | Main landing, full viewport |
| **Jobs** | `/jobs` | `compact` | voice-hero | gradient | 55% | Listing page with filters |
| **Blog** | `/blog` | `compact` | social-hero | gradient | 55% | Article listing |
| **Resources** | `/resources` | `compact` | trust-hero | gradient | 55% | Documentation hub |
| **Features** | `/features` | (custom) | social-hero | dark | 70% | Product showcase |
| **Contact** | `/contact` | (custom) | trust-hero | dark | 70% | Form-focused page |
| **Companies** | `/clients` | `compact` | transport-hero | dark | 70% | Employer directory |

---

## Variant Specifications

### Full Variant (`variant="full"`)
- **Height**: `min-h-[90vh] md:min-h-screen`
- **Layout**: `flex items-center justify-center`
- **Use case**: Homepage hero only
- **Padding**: Content-driven, typically `py-8`

### Compact Variant (`variant="compact"`)
- **Height**: `py-12 md:py-20`
- **Layout**: Standard flow
- **Use case**: Listing pages, secondary pages
- **Purpose**: Show hero branding without pushing content too far below fold

---

## Overlay Standards

### Gradient Overlay (`overlayVariant="gradient"`)
```css
bg-gradient-to-t from-background via-background/60 to-transparent
```
- **Best for**: Pages with prominent headlines
- **Recommended opacity**: 50-60%
- **Effect**: Reveals more image at top, ensures readability at bottom

### Dark Overlay (`overlayVariant="dark"`)
```css
bg-background/70
```
- **Best for**: Form pages, product pages
- **Recommended opacity**: 65-70%
- **Effect**: Consistent darkening for maximum text contrast

### Light Overlay (`overlayVariant="light"`)
```css
bg-background/40
```
- **Best for**: Decorative heroes with minimal text
- **Recommended opacity**: 30-40%

---

## Typography Standards

### Hero Headlines (H1)
```tsx
className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground"
```

### Homepage Headline (Larger)
```tsx
className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-playfair font-bold text-foreground leading-[1.1]"
```

### Gradient Accent Text
```tsx
className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
```

### Subheadline
```tsx
className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto"
```

---

## Badge Standards

All hero badges use consistent styling:

```tsx
<Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20">
  <Icon className="h-3 w-3 mr-1 inline" />
  Badge Text
</Badge>
```

---

## Animation Standards

### Staggered Entrance (Homepage Only)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};
```

### Floating Gradient Blobs (Optional)
- Use sparingly on feature-rich pages
- Always include `motion-safe:animate-*` for accessibility
- Include `pointer-events-none` and `z-[2]`

---

## Accessibility Requirements

1. **Image Alt Text**: Always provide descriptive `imageAlt` prop
2. **Contrast**: Minimum 4.5:1 ratio for body text over overlay
3. **Reduced Motion**: Use `motion-safe:` prefix for animations
4. **Screen Reader**: Component includes `<span className="sr-only">{imageAlt}</span>`

---

## Usage Examples

### Compact Listing Page
```tsx
import { HeroBackground } from '@/components/shared';
import voiceHero from '@/assets/hero/voice-hero.png';

<HeroBackground
  imageSrc={voiceHero}
  imageAlt="Description of the image for accessibility"
  variant="compact"
  overlayVariant="gradient"
  overlayOpacity={55}
>
  <div className="container mx-auto px-4 text-center">
    <Badge>...</Badge>
    <h1>...</h1>
    <p>...</p>
  </div>
</HeroBackground>
```

### Full Landing Page
```tsx
<HeroBackground
  imageSrc={voiceHero}
  imageAlt="Description"
  variant="full"
  overlayVariant="gradient"
  overlayOpacity={60}
>
  <motion.div variants={containerVariants} initial="hidden" animate="visible">
    {/* Animated content */}
  </motion.div>
</HeroBackground>
```

---

## Checklist for New Pages

- [ ] Import appropriate hero image from `@/assets/hero/`
- [ ] Use `HeroBackground` component
- [ ] Set `variant` prop (`full` or `compact`)
- [ ] Choose appropriate `overlayVariant` and `overlayOpacity`
- [ ] Include descriptive `imageAlt` text
- [ ] Use semantic typography tokens (`text-foreground`, `text-muted-foreground`)
- [ ] Test contrast in both light and dark modes
- [ ] Verify mobile responsiveness

---

## File References

- **Component**: `src/components/shared/HeroBackground.tsx`
- **Export**: `src/components/shared/index.ts`
- **Assets**: `src/assets/hero/*.png`

---

*Last updated: February 2026*
